import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import TipTap from "../components/TipTap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

export default function Home() {
  const [chunks, setChunks] = useState([]);
  const [aiResponse, setAiResponse] = useState("");
  const [selected, setSelected] = useState(0);

  const selectChunk = (index) => {
    setSelected(index);
    setAiResponse(chunks[index].content);
  };

  const showCitations = () => {
    alert(
      `Citation: ${chunks[selected].full_citation} \n In Text: ${chunks[selected].in_text_citation}`
    );
  };

  const buttonClicked = async () => {
    const { state } = editor;
    const { from, to } = state.selection;
    const text = state.doc.textBetween(from, to, " ");
    alert(text);

    const bodyData = {
      selectedText: text,
    };
    try {
      const response = await fetch("/api/citation", {
        method: "POST", // or 'PUT'
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();
      console.log("Success:", result);
      const { gpt, similarChunks } = result;
      setChunks(similarChunks);
      setAiResponse(gpt);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none",
      },
    },
    content: `
        <h2>
          Hi there,
        </h2>
        <p>
          this is a basic <em>basic</em> example of <strong>tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
        </p>
        <ul>
          <li>
            That’s a bullet list with one …
          </li>
          <li>
            … or two list items.
          </li>
        </ul>
        <p>
          Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
        </p>
    <pre><code class="language-css">body {
      display: none;
    }</code></pre>
        <p>
          I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
        </p>
        <blockquote>
          Wow, that’s amazing. Good work, boy! 👏
          <br />
          — Mom
        </blockquote>
      `,
  });

  return (
    <div className="flex h-screen overflow-y-auto flex-row bg-primary">
      <div className="basis-1/2 h-screen overflow-y-auto mx-auto">
        <button
          className=" btn w-full text-3xl font-bold underline mx-auto text-center"
          onClick={buttonClicked}
        >
          Find Citation!
        </button>
        <TipTap editor={editor} />
      </div>
      <div className="basis-1/2 shadow-xl bg-secondary flex flex-col justify-between">
        <div className="my-24 mx-auto card w-11/12 bg-neutral text-neutral-content">
          <div className="card-body items-center text-center">
            <h2 className="card-title">Citations over here!</h2>
            <p>{aiResponse}</p>
            <div className="card-actions justify-end">
              <button
                className="btn btn-ghost"
                onClick={() => setAiResponse("")}
              >
                Nope!
              </button>
              <button className="btn btn-primary" onClick={showCitations}>
                Cite!
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="table w-full">
            {/* head */}
            <thead>
              <tr>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* row 1 */}
              {chunks?.map((chunk, index) => {
                return (
                  <tr key={index}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-bold">{chunk.title}</div>
                          <div className="text-sm opacity-50">
                            United States
                          </div>
                        </div>
                      </div>
                    </td>
                    <th>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => {
                          selectChunk(index);
                        }}
                      >
                        Select
                      </button>
                    </th>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
