export const LANGUAGE_VERSIONS = {
  "c++": "10.2.0",
  java: "15.0.2",
  python2: "2.7.18",
  python: "3.10.0",
  c: "10.2.0",
  csharp: "6.12.0",
  javascript: "18.15.0",
  typescript: "5.0.3",
};

export const CODE_SNIPPETS = {
  "c++": "",
  java: `public class HelloWorld {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n`,
  python2: `def greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Alex")\n`,
  python: `def greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Alex")\n`,
  c: "",
  csharp: `using System;\n\nnamespace HelloWorld\n{\n\tclass Hello { \n\t\tstatic void Main(string[] args) {\n\t\t\tConsole.WriteLine("Hello World in C#");\n\t\t}\n\t}\n}\n`,
  javascript: `function greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,
  typescript: `type Params = {\n\tname: string;\n}\n\nfunction greet(data: Params) {\n\tconsole.log("Hello, " + data.name + "!");\n}\n\ngreet({ name: "Alex" });\n`,
};
