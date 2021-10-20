function findFirstScore(protfolio, lookBack='y'){
    let offset = 0; // M
    switch(lookBack) {
        case 'w':
            offset = 7;
            break;
        case 'm':
            offset = 30;
            break;
        case 'y':
            offset = 365;
            break;
    }
    let firstNonZero = 0;
    let counter = 0;

    let dates = Object.keys(protfolio);
    for (let i = (dates.length - offset); i < dates.length; i++) {
        const protfolioVal = protfolio[dates[i]];
        if(parseInt(protfolioVal) > 0){
            firstNonZero = parseInt(protfolioVal);   
            break;
        }
    }
   
    return firstNonZero;
}