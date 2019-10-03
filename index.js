url = new URL(document.location)
jsFile = url.searchParams.get("sseq");
function addLoadingMessage(message){
    let msg_div = document.getElementById('loading');
    if(msg_div == null){
        msg_div = document.createElement("div");
        msg_div.id = "loading";
        msg_div.style.position = "absolute";
        msg_div.style.top = "10pt";
        msg_div.style.left = "10pt";
        document.body.appendChild(msg_div);
    }
    if(typeof display === "undefined"){
        msg_div.innerHTML += `<p>${message}</p>`;
    }
    console.log(message);
}

function setStatus(html){
    if(window.status_div_timer){
        clearTimeout(window.status_div_timer);
    }
    document.getElementById("status").innerHTML = html;
}

function delayedSetStatus(html, delay){
    window.status_div_timer = setTimeout(() => setStatus(html), delay);
}

macros = {
    "\\toda" : ["\\langle #1\\rangle",1],
    "\\tmf" : "\\mathit{tmf}",
    "\\HF" : "H\\F",
    "\\HZ" : "H\\Z",
    "\\semidirect" : "\\rtimes",
    "\\F" : "\\mathbb{F}",
    "\\Z" : "\\mathbb{Z}",
    "\\Zbb" : "\\mathbb{Z}",
    "\\CP" : "\\mathbb{CP}"
}

function katexMathInDelims(string){
    html_list = string.split(/(?:\\\[)|(?:\\\()|(?:\\\))|(?:\\\])|(?:\$)/);
    for(let i = 1; i < html_list.length; i+=2){
        html_list[i] = katex.renderToString(html_list[i], {macros : macros});
    }
    return html_list.join("");
}

IO.loadFromServer("spectralsequences_listing.json").then(example_list => {
    if(jsFile){
        // document.body.id = "sseq_display";
        // let mainDiv = document.createElement("div");
        // mainDiv.id = "main";
        // document.body.appendChild(mainDiv);
        // let jsFilePath;
        // for(let example of example_list){
        //     if(example["js"] === jsFile){
        //         jsFilePath = `js_spectralsequences/examples/${example["js-file"] || example["js"]}.js`;
        //         break;
        //     }
        // }
        
        let script = document.createElement('script');
        // script.onload = function () {
        //     //do stuff with the script
        // };
        script.src = jsFile;
        document.body.appendChild(script);
    } else {
        document.body.id = "spectral_sequences";
        document.documentElement.style.overflow = "";
        let heading = document.createElement("h1");    
        heading.innerHTML = "Spectral Sequences";   
        let table = document.createElement("table");
        document.body.appendChild(heading);
        document.body.appendChild(table);
        table.style.marginBottom = "100px";
        table.style.marginRight = "40px";
        console.log(example_list);
        example_list.sort(function(a,b) {return (a["name"] > b["name"]) ? 1 : ((b["name"] > a["name"]) ? -1 : 0);} ); 
        let colgroup = document.createElement("colgroup");
        let col = document.createElement("col");
        col.setAttribute("width",300);
        colgroup.appendChild(col);
        table.appendChild(colgroup);
        let n = -1;
        for(let example of example_list){
            console.log(example);
            n ++;
            let tr = document.createElement("tr");
            tr.style.marginBottom = "20pt";
            let tdA = document.createElement("td");
            tdA.className = "file";
            tdA.style.verticalAlign = "top";
            let tdB = document.createElement("td");
            tdB.className = "description";
            let a = document.createElement("a");
            if(example["js"]){
                a.href = `?sseq=${example["js"]}`;
            } else if(example["url"]) {
                a.href = example["url"];
            }
            a.innerHTML = katexMathInDelims(example["name"]);
            tdA.appendChild(a);
            if(example["latex"] && a.href){
                tdA.innerHTML += ` (<a href='latex/${example["latex"]}.pdf'>pdf</a>, <a href='latex/${example["latex"]}.tex'>source</a>)`;
            } else if(example["latex"] && ! a.href){
                a.href = `latex/${example["latex"]}.pdf`;
                tdA.innerHTML += ` (<a href='latex/${example["latex"]}.tex'>source</a>)`;
            }
            tr.appendChild(tdA);
            if(example["description"]){
                tdB.innerHTML = katexMathInDelims(example["description"]);
                tr.appendChild(tdB);
                tr.id = "row" + n;
                table.appendChild(tr);
            } else {
                console.log(example["name"]);
            }
            // MathJax.Hub.Queue(["Typeset", MathJax.Hub, "row" + n]);
            // MathJax.Hub.Queue(() => {
            //     tr.removeAttribute("style");
            // });
        }        
    }
});