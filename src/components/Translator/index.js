import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import "./style.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faRetweet } from "@fortawesome/free-solid-svg-icons";
import { TranslateService } from "../../services/translate";
import { Button, Select } from "antd";
import { languageOptions, localStorageFromToKey, subtitleClassname } from "../../constants";
import { setFromToInitialValues } from "../../utils/helpers";

const Translator = () => {
  const [listening, setListening] = useState(false);
  let [from, setFrom] = useState(setFromToInitialValues("from", "tr"));
  let [to, setTo] = useState(setFromToInitialValues("to", "en"));

  const translateService = useMemo(() => new TranslateService(), []);

  const speechRecognition = useMemo(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const instance = new SpeechRecognition();
    instance.continuous = true;
    return instance;
  }, []);

  const speechSynthesisUtterance = useMemo(
    () => new SpeechSynthesisUtterance(),
    []
  );

  const speak = useCallback(
    (text) => {
      speechSynthesisUtterance.text = text;
      speechSynthesisUtterance.lang = to;
      speechSynthesis.speak(speechSynthesisUtterance);
    },
    [speechSynthesisUtterance, to]
  );

  const setSubtitle = useCallback(
    async (text) => {
      // eslint-disable-next-line no-undef
      let [tab] = await chrome.tabs.query({ active: true });
      // eslint-disable-next-line no-undef
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text, subtitleClassname) => {
          let subtitleElement = document.querySelector(`.${subtitleClassname}`);
          if (!subtitleElement) {
            subtitleElement = document.createElement("div");
            subtitleElement.classList.add(subtitleClassname);
            subtitleElement.style.position = "fixed";
            subtitleElement.style.bottom = "50px";
            subtitleElement.style.left = "50%";
            subtitleElement.style.transform = "translateX(-50%)";
            subtitleElement.style.background = "white";
            subtitleElement.style.padding = "10px";
            subtitleElement.style.borderRadius = "2px";
            subtitleElement.style.boxShadow = "0 0 5px black";
            subtitleElement.style.maxWidth = "500px";
            subtitleElement.style.fontSize = "20px";
            subtitleElement.style.pointerEvents = "none";
            subtitleElement.style.zIndex = 1000;
            subtitleElement.textContent = text;
            document.body.appendChild(subtitleElement);
          }
          subtitleElement.textContent = text;

          setTimeout(() => {
            subtitleElement.remove();
          }, 2000);
        },
        args: [text, subtitleClassname],
      });
      },
    [],
  )

  const translate = useCallback(
    (value) => {
      if (!value) return;

      translateService
        .translate({
          from,
          to,
          q: value,
        })
        .then((response) => {
          const text = response.data[0];
          speak(text);
          setSubtitle(text);
        })
        .catch((error) => {
          console.error(error);
        });
    },
    [from, setSubtitle, speak, to, translateService]
  );

  useEffect(() => {
    if (speechRecognition) {
      speechRecognition.onresult = (event) => {
        const current = event.resultIndex;
        const { transcript } = event.results[current][0];
        translate(transcript);
      };

      speechRecognition.onerror = () => {
        setListening(false);
      };
    }

    return () => {
      speechRecognition?.stop();
    };
  }, [speechRecognition, translate]);

  const onClickMicrophone = () => {
    if (listening) {
      speechRecognition.stop();
      setListening(false);
    } else {
      speechRecognition.lang = from;
      speechRecognition.start();
      setListening(true);
    }
  };

  const setLocalStorage = ({ from, to }) => {
    localStorage.setItem(localStorageFromToKey, JSON.stringify({ from, to }));
  };

  const onClickReplaceFromAndTo = () => {
    [from, to] = [to, from];
    setFrom(from);
    setTo(to);
    setLocalStorage({ from, to });
  };

  const onChangeFrom = (val) => {
    if (val === to) return;
    setFrom(val);
    setLocalStorage({ from: val, to });
  };

  const onChangeTo = (val) => {
    if (val === from) return;
    setTo(val);
    setLocalStorage({ from, to: val });
  };

  const isDisabledLanguageSelection = () => listening;

  const setMicrophoneColor = () => (listening ? "red" : "black");

  return (
    <div className="translator_container">
      <div className="title">You speak, We translate!</div>
      <div className="language_selection_container">
        <Select
          showSearch
          placeholder="From"
          options={languageOptions}
          value={from}
          onChange={onChangeFrom}
          disabled={isDisabledLanguageSelection()}
          listHeight={100}
        />
        <Button
          onClick={onClickReplaceFromAndTo}
          disabled={isDisabledLanguageSelection()}
        >
          <FontAwesomeIcon icon={faRetweet} />
        </Button>
        <Select
          showSearch
          placeholder="To"
          options={languageOptions}
          value={to}
          onChange={onChangeTo}
          disabled={isDisabledLanguageSelection()}
          listHeight={100}
        />
      </div>
      <div>
        <Button onClick={onClickMicrophone}>
          <FontAwesomeIcon icon={faMicrophone} color={setMicrophoneColor()} />
        </Button>
      </div>
    </div>
  );
};

export default memo(Translator);
