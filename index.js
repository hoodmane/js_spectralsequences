url = new URL(document.location)
jsFile = url.searchParams.get("sseq")
var script = document.createElement('script');
// script.onload = function () {
//     //do stuff with the script
// };
script.src = jsFile;

document.body.appendChild(script);