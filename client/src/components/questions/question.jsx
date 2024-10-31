import React, { useEffect, useState } from "react";
import axios from "axios";
import { questionroute } from "@/api/ApiRoutes";

const RandomQuestion = () => {
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);

  // Fetch random question from the backend
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        console.log("Question route:", questionroute); // Check the API route
        const response = await axios.get(questionroute);
        console.log("API Response:", response.data); // Log the response
        setQuestion(response.data);
      } catch (error) {
        setError("Error fetching question. Please try again.");
        console.error("Error fetching question:", error);
      }
    };

    fetchQuestion();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Random Question</h2>
      {question ? (
        <div>
          <h3>{question.title}</h3>
          <p>{question.description}</p>
          <pre>
            Sample Input: {JSON.stringify(question.input_format, null, 2)}
          </pre>
          <pre>
            Sample Output: {JSON.stringify(question.output_format, null, 2)}
          </pre>
          <pre>
            Constraints: {JSON.stringify(question.constraints, null, 2)}
          </pre>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default RandomQuestion;
