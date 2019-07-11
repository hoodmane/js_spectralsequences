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


url = new URL(document.location)
jsFile = url.searchParams.get("sseq");
if(jsFile){
    document.body.id = "sseq_display";
    // let mainDiv = document.createElement("div");
    // mainDiv.id = "main";
    // document.body.appendChild(mainDiv);
    let script = document.createElement('script');
    // script.onload = function () {
    //     //do stuff with the script
    // };
    script.src = jsFile;
    document.body.appendChild(script);
} else {
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
    document.body.id = "spectral_sequences";
    let heading = document.createElement("h1");
    heading.innerHTML = "Spectral Sequences";
    document.body.appendChild(heading);
    let table = document.createElement("table");
    for(let example of example_list){
        let tr = document.createElement("tr");
        let tdA = document.createElement("td");
        tdA.className = "file";
        let tdB = document.createElement("td");
        tdB.className = "description";
        let a = document.createElement("a");
        a.href = "?sseq=" + example["filename"];
        if(example["properties"]["name"]){
            a.innerHTML = example["properties"]["name"];
        } else {
            a.innerHTML = example["filename"];
        }
        tdA.appendChild(a);
        tdB.innerHTML = example["properties"]['description'];
        tr.appendChild(tdA);
        if(example["properties"]['description']){
            tr.appendChild(tdB);
        }
        table.appendChild(tr);
    }
    document.body.appendChild(table);
}
