import { useRef, useState } from "react";
import { Box, HStack, VStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { RandomQuestion, LanguageSelector } from "@/components";

const CodeEditor = ({ socket, roomId, userName, setTimerRunning }) => {
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
      <HStack spacing={4} alignItems="flex-start">
        <RandomQuestion
          editorRef={editorRef}
          language={language}
          socket={socket}
          roomId={roomId}
          userName={userName}
          setTimerRunning={setTimerRunning}
        />
        <Box w="50%">
          <Box bg="#0d0d1c" p={3} borderRadius="md" mb={2} borderWidth="1px" borderColor="#2a2a4a">
            <Box className="flex items-center justify-between">
              <Box className="flex items-center">
                <Box className="h-3 w-3 rounded-full bg-red-500 mr-2"></Box>
                <Box className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></Box>
                <Box className="h-3 w-3 rounded-full bg-green-500 mr-2"></Box>
                <span className="text-gray-400 text-sm ml-2">Code Editor</span>
              </Box>
              <LanguageSelector language={language} onSelect={onSelect} />
            </Box>
          </Box>
          <Box borderWidth="1px" borderColor="#2a2a4a" borderRadius="md" overflow="hidden" bg="#1E1E1E" boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)">
            <Editor
              options={{
                minimap: {
                  enabled: false,
                },
                fontSize: 14,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                padding: { top: 16 },
                lineHeight: 1.6,
                fontFamily: "'Fira Code', monospace",
              }}
              height="75vh"
              theme="vs-dark"
              language={language}
              onMount={onMount}
              value={value}
              onChange={(value) => setValue(value)}
            />
          </Box>
        </Box>
      </HStack>
    </Box>
  );
};
export default CodeEditor;
