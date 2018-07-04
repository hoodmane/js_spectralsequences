url = new URL(document.location)
jsFile = url.searchParams.get("sseq")
if(jsFile){
    if(jsFile !=== "examples/EO32.js"){
        jsFile = "examples/" + jsFile + ".js";
    }
    var script = document.createElement('script');
    // script.onload = function () {
    //     //do stuff with the script
    // };
    script.src = jsFile;
    
    document.body.appendChild(script);
} else {
    console.log(example_list);

}
