import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  deleteObject,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { SpeedDial } from "primereact/speeddial";
import React, { useRef, useState } from "react";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { FileUpload } from "primereact/fileupload";
import { dbService, storageService } from "../myBase";
import { v4 as uuidv4 } from "uuid";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const Tweet = ({ tweetObj, isOwner }) => {
  const [editing, setEditing] = useState(false);
  const [newTweet, setNewTweet] = useState(tweetObj.text);
  const [fileAttach, setFileAttach] = useState("");
  const fileInput = useRef();

  const onSelect = (event) => {
    console.log(event.files);
    const { files: files } = event;
    const theFile = files[0];
    const reader = new FileReader();

    reader.onloadend = (finishedEvent) => {
      const {
        currentTarget: { result },
      } = finishedEvent;
      setFileAttach(result);
    };
    if (theFile) {
      reader.readAsDataURL(theFile);
    }
    console.log(theFile);
  };
  const toggleEditing = () => {
    setEditing((prev) => !prev);
  };
  const onSubmit = async (event) => {
    event.preventDefault();
    let fileUrl = "";
    if (fileAttach != "") {
      if (tweetObj.fileUrl) {
        await deleteObject(ref(getStorage(), tweetObj.fileUrl));
      }
      const fileRef = ref(storageService, `${tweetObj.id}/${uuidv4()}`);
      const response = await uploadString(fileRef, fileAttach, "data_url");
      fileUrl = await getDownloadURL(response.ref);

      await updateDoc(doc(dbService, "tweets", `${tweetObj.id}`), {
        text: newTweet,
        fileUrl: fileUrl,
      });
    }
    setEditing(false);
  };
  const onChange = (event) => {
    const {
      target: { value },
    } = event;
    setNewTweet(value);
  };
  const items = [
    {
      label: "Delete",
      icon: "pi pi-trash",
      command: async (event) => {
        const ok = window.confirm(
          "Are you sure you want to delete this tweet?"
        );
        console.log(ok);
        if (ok) {
          await deleteDoc(doc(dbService, "tweets", `${tweetObj.id}`));
          if (tweetObj.fileUrl) {
            await deleteObject(ref(getStorage(), tweetObj.fileUrl));
          }
        }
      },
    },
    {
      label: "Edit",
      icon: "pi pi-file-edit",
      command: () => {
        setEditing((prev) => !prev);
      },
    },
  ];
  return (
    <div>
      {editing ? (
        <>
          <div className="tweet">
            <form>
              <InputTextarea
                autoResize
                value={newTweet}
                visible="true"
                onChange={onChange}
                placeholder="Write a content"
                rows={5}
              />
              <FileUpload
                onSelect={onSelect}
                ref={fileInput}
                name="demo[]"
                url="./upload"
                multiple
                accept="image/*"
                mode="basic"
              />
              {fileAttach && (
                <div>
                  <img
                    className="img-styles"
                    src={fileAttach}
                    width="200px"
                    height="200px"
                  />
                </div>
              )}
              <div className="edit-btn">
                <Button
                  type="submit"
                  label="Post"
                  icon="pi pi-check"
                  autoFocus
                  style={{ marginRight: "2px" }}
                  onClick={onSubmit}
                />
                <Button
                  label="Cancel"
                  icon="pi pi-times"
                  onClick={() => toggleEditing()}
                  className="p-button-text"
                  style={{ marginLeft: "2px" }}
                />
              </div>
            </form>
          </div>
        </>
      ) : (
        <>
          <div className="tweet">
            <div className="info-style">
              <div>{tweetObj.displayName}</div>
              {isOwner && (
                <SpeedDial
                  model={items}
                  showIcon="pi pi-cog"
                  direction="left"
                  //   style={{ left: "calc(50% - 2rem)", top: 0 }}
                />
              )}
            </div>
            <h3>{tweetObj.text} </h3>
            {tweetObj.fileUrl && <img src={tweetObj.fileUrl} />}
          </div>
        </>
      )}
    </div>
  );
};

export default Tweet;