import { useRef, useState } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { RandomQuestion, LanguageSelector } from "@/components";

const CodeEditor = ({ socket, roomId, userName, game }) => {
  const editorRef = useRef();
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("python");

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };
  const toastOptions = {
    position: "bottom-right",
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };
  const onSelect = (language) => {
    setLanguage(language);
  };

  return (
    <Box>
      <HStack spacing={4}>
        {/* <Output editorRef={editorRef} language={language} /> */}
        <RandomQuestion
          editorRef={editorRef}
          language={language}
          socket={socket}
          roomId={roomId}
          userName={userName}
          // setIsTimerRunning={setIsTimerRunning}
        />
        <Box w="50%">
          <LanguageSelector language={language} onSelect={onSelect} />
          <Editor
            options={{
              minimap: {
                enabled: false,
              },
            }}
            height="75vh"
            theme="vs-dark"
            language={language}
            // defaultValue={CODE_SNIPPETS[language]}
            onMount={onMount}
            value={value}
            onChange={(value) => setValue(value)}
          />
        </Box>
      </HStack>
    </Box>
  );
};
export default CodeEditor;
