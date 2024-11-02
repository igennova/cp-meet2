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

export const language_ID = {
  "c++": 105,
  python: 100,
};

export const CODE_SNIPPETS = {
  "c++":
    '#include <iostream>\nint main() {\n    std::cout << "Hello, World!";\n    return 0;\n}',
  java: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  python2: 'print "Hello, World!"',
  python: 'print("Hello, World!")',
  c: '#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  csharp:
    'using System;\nclass HelloWorld {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
  javascript: 'console.log("Hello, World!");',
  typescript: 'console.log("Hello, World!");',
};

const localhost = `http://localhost:5000`;

export const routes = {
  localhost,
  questionroute: `${localhost}/api/questions`,
  getroute: `${localhost}/api/getcode`,
};
