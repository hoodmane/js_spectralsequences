// Name: ASS $S_2$
// Description: Adams Spectral Sequence for $S_2$. The $E_2$ page was generated by Amelia Perry's resolution program, the differentials and extensions were copied from Dan Isaksen.

"use strict";


let file_name = getJSONFilename("ASS-S_2");

Sseq.loadFromServer(file_name).catch((error) => console.log(error)).then((sseq) => {
    sseq._getXOffset = tools.fixed_tower_xOffset.bind(sseq);
    sseq._getYOffset = (c) => c.y_offset || 0;

    new BasicDisplay("#main", sseq);
    return;
}).catch(e => console.log(e));
