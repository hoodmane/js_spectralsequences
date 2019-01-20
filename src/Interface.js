applyAttributesToElement = function applyAttributesToElement(element, attributes){
    if(!element || !attributes){
        return;
    }
    for(let kv of Object.entries(attributes)){
        element.setAttribute(kv[0], kv[1]);
    }
};

fixFormHTML = {};
fixFormHTML.radio = function(doc, field){
    let elts = doc.getElementsByName(field.name);
    let items = field.options.items;
    for(let i = 0; i < elts.length; i++){
        applyAttributesToElement(elts[i], items[i].attributes);
    }
};

class PopupForm {
    constructor(form_options, popup_options){
        let form_obj = Object.assign({}, PopupForm.default_form_obj, form_options);
        this.form_obj = form_obj;
        let name = form_obj.name;
        form_obj.actions = {};
        form_obj.actions[this.form_obj.accept_button_name] = function() {
            // This call to ".save()" produces a logged error but seems to have the desired effect
            // of moving the current set of form fields into ".record". save is supposed to send the form data
            // to a server. There doesn't seem to be an API call to save current fields into .record, and
            // I couldn't figure out another way to access them.
            w2ui[name].save();
            backupRecord(w2ui[name]);
            let errs = w2ui[name].validate();
            if (errs.length > 0) {
                return;
            }
            saveRecord(w2ui[name]);
            w2ui[name].onSuccess();
            w2popup.close();
        };
        form_obj.actions["Cancel"] = function cancel() {
            // No special handling if the user clicks the cancel button as opposed to escape or close or click outside the box.
            w2popup.close();
        };

        $().w2form(this.form_obj);
        let form = w2ui[name];
        this.form = form;
        this.fixFormHTML(form);

        this.popup_obj = Object.assign({}, PopupForm.default_popup_obj, popup_options);
        // No idea what this is for I just copied it from http://w2ui.com/web/demos/#!forms/forms-8
        this.popup_obj.onToggle = function (event) {
            $(form.box).hide();
            event.onComplete = function () {
                $(form.box).show();
                form.resize();
            }
        };
        // Pressing "Enter" is the same as clicking "open"
        this.popup_obj.onKeydown = function(event){
            if(event.originalEvent.key === "Enter"){
                if(document.getElementsByClassName("w2ui-error").length > 0){
                    return;
                }
                form.actions[form_obj.accept_button_name]();
            }
        };

        this.popup_obj.onClose = function(event){
                event.onComplete = () => restoreRecord(form);
        };

        this.userOnOpen = this.popup_obj.onOpen;
        this.popup_obj.onOpen = (event) => {
            let observer = new MutationObserver((mutation_list) => {
                for(let e of mutation_list){
                    if((e.target.id === "w2ui-popup" || e.target.id === "w2ui-lock") && e.target.style.opacity !== 0){
                        e.target.style.opacity = '0';
                        $('#w2ui-popup').css(w2utils.cssPrefix('transform', ''));
                    }
                }
            });
            observer.observe(document.body, { attributes: true, subtree: true });
            event.onComplete = () => {
                observer.disconnect();
                $('#w2ui-popup #form').w2render(form);
                if(this.userOnOpen){
                    this.userOnOpen(event);
                }
                let opacity = 0.4;
                let speed = 0.3;
                $('#w2ui-popup')
                    .css('opacity', '1')
                    .css(w2utils.cssPrefix({
                        'transition': speed + 's opacity, ' + speed + 's -webkit-transform',
                        'transform' : 'scale(1)'
                    }));
                $('#w2ui-lock')
                    .css('opacity', opacity)
                    .css(w2utils.cssPrefix('transition', speed + 's opacity'));
                // setTimeout(function () {
                //     $('#w2ui-popup').css(w2utils.cssPrefix('transform', ''));
                // }, speed * 1000);
            }
        };

        this.open = this.open.bind(this);
//        w2ui.open_sseq_form.record['sseq-file-name'] = '';
    }

    open(){
        if($('#w2ui-popup').length > 0){
            return;
        }
        $().w2popup(this.popup_obj);
    }

    fixFormHTML(){
        let doc = new DOMParser().parseFromString(this.form.formHTML, "text/html");
        for(let f of this.form.fields){
            if(f.attributes){
                applyAttributesToElement(doc.getElementsByName(f.name)[0], f.attributes);
            }
            if(fixFormHTML[f.type]){
                fixFormHTML[f.type](doc, f);
            }
        }
        this.form.formHTML = new XMLSerializer().serializeToString(doc);
    };


}

PopupForm.default_form_obj = {style: 'border: 0px; background-color: transparent;'};
PopupForm.default_popup_obj = {
    body    : '<div id="form" style="width: 100%; height: 100%;"></div>',
    style   : 'padding: 15px 0px 0px 0px opacity: 0',
    width   : 500,
    height  : 220
};//hi

exports.PopupForm = PopupForm;


class Undo {
    constructor(sseq){
        this.sseq = sseq;
        this.undoStack = [];
        this.redoStack = [];
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
    };

    add(undoCallback, redoCallback) {
        this.undoStack.push({undo: undoCallback, redo: redoCallback});
        this.redoStack = [];
    };

    clear(){
        this.undoStack = [];
        this.redoStack = [];
    };

    addClass(c){
        undo.add(() => {
            this.sseq.deleteClass(c);
            // updateLastClass(lastClass);
        }, () => {
            this.sseq.reviveClass(c);
            // updateLastClass(c);
        });
    };

    addClassList(l){
        undo.add(() => {
            l.forEach(c => this.sseq.deleteClass(c));
            sseq.update();
            // updateLastClass(lastClass);
        }, () => {
            l.forEach(c => this.sseq.reviveClass(c));
            sseq.update();
            // updateLastClass(c);
        });
    };

    addEdge(e){
        undo.add(() => this.sseq.deleteEdge(e), () => this.sseq.reviveEdge(e));
    };

    addEdgeList(l){
        undo.add(() => l.forEach(e => this.sseq.deleteEdge(e)), () => l.forEach(e => this.sseq.reviveEdge(e)));
    };

    merge(){
        let e1 = this.undoStack.pop();
        let e2 = this.undoStack.pop();
        this.add(() => {e1.undo(); e2.undo()}, () => {e2.redo(); e1.redo()});
    };

    undo() {
        if (this.undoStack.length === 0) {
            return;
        }
        let e = this.undoStack.pop();
        e.undo();
        this.redoStack.push(e);
        sseq.display_sseq.update();
    };

    redo() {
        if (this.redoStack.length === 0) {
            return;
        }
        let e = this.redoStack.pop();
        e.redo();
        this.undoStack.push(e);
        sseq.display_sseq.update();
    };

}

exports.Undo = Undo;