     1|export const IDL = {
     2|  version: "0.1.0",
     3|  name: "lib",
     4|  instructions: [
     5|    {
     6|      name: "createCampaign",
     7|      accounts: [
     8|        { name: "vendor", isMut: true, isSigner: true },
     9|        { name: "campaign", isMut: true, isSigner: false },
    10|        { name: "escrowWallet", isMut: true, isSigner: false },
    11|        { name: "vendorWallet", isMut: true, isSigner: false },
    12|        { name: "rent", isMut: false, isSigner: false },
    13|        { name: "systemProgram", isMut: false, isSigner: false },
    14|        { name: "tokenProgram", isMut: false, isSigner: false },
    15|      ],
    16|      args: [{ name: "amount", type: "u64" }],
    17|    },
    18|    {
    19|      name: "payoutInfluencer",
    20|      accounts: [
    21|        { name: "admin", isMut: true, isSigner: true },
    22|        { name: "campaign", isMut: true, isSigner: false },
    23|        { name: "escrowWallet", isMut: true, isSigner: false },
    24|        { name: "influencerWallet", isMut: true, isSigner: false },
    25|        { name: "feeCollector", isMut: true, isSigner: false },
    26|        { name: "tokenProgram", isMut: false, isSigner: false },
    27|      ],
    28|      args: [],
    29|    },
    30|  ],
    31|  accounts: [
    32|    {
    33|      name: "AdCampaign",
    34|      type: {
    35|        kind: "struct",
    36|        fields: [
    37|          { name: "vendor", type: "publicKey" },
    38|          { name: "amount", type: "u64" },
    39|          { name: "isCompleted", type: "bool" },
    40|        ],
    41|      },
    42|    },
    43|  ],
    44|} as const;
    45|
    46|export type AdBlink = typeof IDL;
    47|