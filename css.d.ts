     1|declare module '*.css' {
     2|	const content: string;
     3|	export default content;
     4|}
     5|
     6|declare module '*.module.css' {
     7|	const classes: { readonly [key: string]: string };
     8|	export default classes;
     9|}
    10|