import React, { useEffect, useMemo, useState } from "react";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";

const Translator = () => {
  const [listening, setListening] = useState(false);
  const [value, setValue] = useState("");

  const speechRecognition = useMemo(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const instance = new SpeechRecognition();
    instance.lang = "tr";
    instance.continuous = true;
    return instance;
  }, []);

  const speechSynthesisUtterance = useMemo(() => new SpeechSynthesisUtterance(), []);

  useEffect(() => {
    if (speechRecognition) {
      speechRecognition.onresult = (event) => {
        const current = event.resultIndex;
        const { transcript } = event.results[current][0];
        setValue((prevState) => `${prevState} ${transcript}`);
      };

      speechRecognition.onerror = () => {
        setListening(false);
      };

      speechRecognition.onend = () => {
        speechSynthesisUtterance.text = value;
        speechSynthesisUtterance.lang = "en-US";
        speechSynthesis.speak(speechSynthesisUtterance);
        setValue('');
      }
    }

    return () => {
      speechRecognition?.stop();
    };
  }, [speechRecognition, value, speechSynthesisUtterance]);

  const onClickMicrophone = () => {
    if (listening) {
      speechRecognition?.stop();
      setListening(false);
    } else {
      speechRecognition?.start();
      setListening(true);
    }
  };

  return (
    <div className="translator_container">
      <div className="title">You speak, We translate!</div>
      <div className="buttons_container">
        <button onClick={onClickMicrophone}>
          {speechSynthesis.speaking ? (
            <FontAwesomeIcon icon={faVolumeHigh} />
          ) : (
            <FontAwesomeIcon icon={faMicrophone} />
          )}
        </button>
      </div>
    </div>
  );
};

export default Translator;
