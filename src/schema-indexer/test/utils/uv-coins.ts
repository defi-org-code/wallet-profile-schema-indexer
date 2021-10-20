export type coin = {
    symbol: string
    address: string
    createBlock: number
    decimals?: number
    lpAddress: string
    lpCreateBlock: number
    balanceMappingSlot?: string
    forceDecimals?: number
}


const coins_arr: Array<coin> = [
    {
        symbol:"floki",
        address:"0x2de72ada48bdf7bac276256d3f016fe058490c34",
        createBlock:12778623,
        decimals:9,
        lpAddress:"0xe571b939062474bfeb593a3f80fee9d2265b3b18",
        lpCreateBlock:12778623,
        },
    {
        symbol:"babyelon",
        address:"0xdfb4a81727aa961b6ee830720843104fae0fdff9",
        createBlock:0,
        decimals: 18,
        lpAddress:"0x20b29f2c6ab60880a0d062a72d33bdee3249e64d",
        lpCreateBlock: 12802116,
    },
    {
        symbol:"babydoge",
        address:"0xac8e13ecc30da7ff04b842f21a62a1fb0f10ebd5",
        createBlock:0,
        decimals: 18,
        lpAddress:"0xaba7af37dbdc67b7463917e483b55340d153928a",
        lpCreateBlock: 12812685,
    },
    {
        symbol:"dwags",
        address:"0x9f8eef61b1ad834b44c089dbf33eb854746a6bf9",
        createBlock:0,
        decimals: 18,
        lpAddress:"0xaee132d8294b1531f21a432149ccf16d65f9abfa",
        lpCreateBlock: 12789772,
    },
    {
        symbol:"mishka",
        address:"0x976091738973b520a514ea206acdd008a09649de",
        createBlock:0,
        decimals: 18,
        lpAddress:"0x68ca62c3c0cc90c6501181d625e94b4f0fdc869c",
        lpCreateBlock:12768620,
    },
    {
    symbol:"comp",
    address:"0xc00e94cb662c3520282e6f5717214004a7f26888",
    createBlock:9601359,
    decimals:18,
    lpAddress:"0xcffdded873554f362ac02f8fb1f02e5ada10516f",
    lpCreateBlock:10272054,
    },
    {
        symbol:"sushi",
        address:"0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
        createBlock:10736094,
        decimals:18,
        lpAddress:"0xce84867c3c02b05dc570d0135103d3fb9cc19433",
        lpCreateBlock:10736320,
    },
    // {
    //     symbol:"grey",
    //     address:"0x9b2d81a1ae36e8e66a0875053429816f0b6b829e",
    //     createBlock:0,
    //     decimals: 18,
    //     lpAddress:"0x7ee2d59972dd251f4212cfb69e0414cb33962650",
    //     lpCreateBlock: 12794278,
    // },
    {
        symbol:"woo",
        address:"0x4691937a7508860f876c9c0a2a617e7d9e945d4b",
        createBlock:0,
        decimals:18,
        lpAddress:"0x6ada49aeccf6e556bb7a35ef0119cc8ca795294a",
        lpCreateBlock: 11154588 ,
    },
    {
        symbol:"yfi",
        address:"0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
        createBlock:0,
        decimals: 18,
        lpAddress:"0x2fdbadf3c4d5a8666bc06645b8358ab803996e28",
        lpCreateBlock:10483166,
    },
    {
        symbol:"crv",
        address:"0xd533a949740bb3306d119cc777fa900ba034cd52",
        createBlock:10647806,
        decimals:18,
        lpAddress:"0x3da1313ae46132a397d90d95b1424a9a7e3e0fce",
        lpCreateBlock:10828474,
    },
    {
        symbol:"alcx",
        address:"0xdbdb4d16eda451d0503b854cf79d55697f90c8df",
        createBlock:0,
        decimals:18,
        lpAddress:"0xc3f279090a47e80990fe3a9c30d24cb117ef91a8",
        lpCreateBlock: 11937674,
    },
    // { // no price
    //     symbol:"snx",
    //     address:"0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0xa1d7b2d891e3a1f9ef4bbc5be20630c2feb1c470",
    //     lpCreateBlock: 10829272,
    // },
    // {
    //     symbol:"perp",
    //     address:"0xbc396689893d065f41bc2c6ecbee5e0085233447",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0xf66369997ae562bc9eec2ab9541581252f9ca383",
    //     lpCreateBlock: 10846824,
    // },
    {
        symbol:"ren",
        address:"0x408e41876cccdc0f92210600ef50372656052a38",
        createBlock:0,
        decimals:18,
        lpAddress:"0x611cde65dea90918c0078ac0400a72b0d25b9bb1",
        lpCreateBlock: 10829214,
    },
    {
        symbol:"pols",
        address:"0x83e6f1e41cdd28eaceb20cb649155049fac3d5aa",
        createBlock:0,
        decimals:18,
        lpAddress:"0xffa98a091331df4600f87c9164cd27e8a5cd2405",
        lpCreateBlock: 10957548,
    },
    // {
    //     symbol:"ntfx",
    //     address:"0x83e6f1e41cdd28eaceb20cb649155049fac3d5aa",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0x31d64f9403e82243e71c2af9d8f56c7dbe10c178",
    //     lpCreateBlock: 11668073,
    // },
    {
        symbol:"hegic",
        address:"0x584bc13c7d411c00c01a62e8019472de68768430",
        createBlock:0,
        decimals:18,
        lpAddress:"0x1273ad5d8f3596a7a39efdb5a4b8f82e8f003fc3",
        lpCreateBlock: 10848938,
    },

    {
        symbol:"88mph",
        address:"0x8888801af4d980682e47f1a9036e589479e835c5",
        createBlock:0,
        decimals:18,
        lpAddress:"0x4d96369002fc5b9687ee924d458a7e5baa5df34e",
        lpCreateBlock: 11290258,
    },
    {
        symbol:"maker",
        address:"0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
        createBlock:0,
        decimals:18,
        lpAddress:"0xc2adda861f89bbb333c90c492cb837741916a225",
        lpCreateBlock: 10091443,
    },
    // {
    //     symbol:"rune",
    //     address:"0x3155ba85d5f96b2d030a4966af206230e46849cb",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0x8d2a4cc2e2ca0f7ab011b686449dc82c3af924c7",
    //     lpCreateBlock: 11656771,
    // },

    // {
    //     symbol:"alpha",
    //     address:"0xa1faa113cbe53436df28ff0aee54275c13b40975",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0xf55c33d94150d93c2cfb833bcca30be388b14964",
    //     lpCreateBlock: 11509155,
    // },
    // {
    //     symbol:"mirror",
    //     address:"0x09a3ecafa817268f77be1283176b946c4ff2e608",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0x57ab5aeb8bac2586a0d437163c3eb844246336ce",
    //     lpCreateBlock: 11386303,
    // },
    // {
    //     symbol:"cream",
    //     address:"0x2ba592f78db6436527729929aaf6c908497cb200",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0xf169cea51eb51774cf107c88309717dda20be167",
    //     lpCreateBlock: 10917179,
    // },

    // {
    //     symbol:"TON",
    //     address:"0x77777feddddffc19ff86db637967013e6c6a116c",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0x0c722a487876989af8a05fffb6e32e45cc23fb3a",
    //     lpCreateBlock: 11482353,
    // },
    // {
    //     symbol:"Rai",
    //     address:"0x03ab458634910aad20ef5f1c8ee96f1d6ac54919",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0x8ae720a71622e824f576b4a8c03031066548a3b1",
    //     lpCreateBlock: 11848624,
    // },
]



export function getCoins(): Array<coin> {
    return coins_arr
}




//    { no v2
    //       symbol:"ohm",
    //       address:"0x383518188c0c6d7730d91b2c03a03c837814a899",
    //       createBlock:0,
    //       decimals:9,
    //       lpAddress:"0x2dce0dda1c2f98e0f171de8333c3c6fe1bbf4877",
    //       lpCreateBlock: 12752022,
    //   },



    // {
    //     symbol:"safferon",
    //     address:"0xb753428af26e81097e7fd17f40c88aaa3e04902c",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0xc76225124f3caab07f609b1d147a31de43926cd6",
    //     lpCreateBlock: 10917179,
    // },

        // {
    //     symbol:"nexus",
    //     address:"0xd7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0x23bff8ca20aac06efdf23cee3b8ae296a30dfd27",
    //     lpCreateBlock: 10480193,
    // },
      // { PROXY
    //     symbol:"ampl",
    //     address:"0xd46ba6d942050d489dbd938a2c909a5d5039a161",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0xc5be99a02c6857f9eac67bbce58df5572498f40c",
    //     lpCreateBlock: 10091499,
    // },
    // {
    //     symbol:"wbtc",
    //     address:"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    //     createBlock:0,
    //     decimals:18,
    //     lpAddress:"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    //     lpCreateBlock: 11668073,
    // },