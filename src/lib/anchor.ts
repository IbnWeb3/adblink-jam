     1|import { Connection, PublicKey } from "@solana/web3.js";
     2|import { Program, AnchorProvider, Idl } from "@project-serum/anchor";
     3|import { IDL } from "./idl";
     4|
     5|export const PROGRAM_ID = new PublicKey(
     6|  "BPw6hyaYnmVu2F2JbND5KKss3jYuW9b6jkozfBFGhVx3"
     7|);
     8|
     9|export const DEVNET_RPC = "https://api.devnet.solana.com";
    10|
    11|export function getConnection(): Connection {
    12|  return new Connection(DEVNET_RPC, "confirmed");
    13|}
    14|
    15|export function getProgram(wallet: Parameters<typeof AnchorProvider>[1]): Program {
    16|  const connection = getConnection();
    17|  const provider = new AnchorProvider(connection, wallet, {
    18|    commitment: "confirmed",
    19|  });
    20|  return new Program(IDL as Idl, PROGRAM_ID, provider);
    21|}
    22|