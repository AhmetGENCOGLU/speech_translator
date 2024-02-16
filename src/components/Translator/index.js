import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import "./style.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faRetweet } from "@fortawesome/free-solid-svg-icons";
import { TranslateService } from "../../services/translate";
import { Button, Select } from "antd";
import { languageOptions, localStorageFromToKey } from "../../constants";
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
          speak(response.data[0]);
        })
        .catch((error) => {
          console.error(error);
        });
    },
    [from, speak, to, translateService]
  );

  const setSubtitle = useCallback(
    async (text) => {
      // eslint-disable-next-line no-undef
      let [tab] = await chrome.tabs.query({ active: true });
      // eslint-disable-next-line no-undef
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const subtitleClassname = 'speech_translator_subtitle';
          let existElement = document.getElementsByClassName(subtitleClassname)[0];
          if (!existElement) {
            existElement = document.createElement("div");
            existElement.classList.add(subtitleClassname);
            existElement.style.position = "fixed";
            existElement.style.bottom = "50px";
            existElement.style.left = "50%";
            existElement.style.transform = "translateX(-50%)";
            existElement.style.background = "white";
            existElement.style.zIndex = 1000;
            existElement.textContent = text;
            document.body.appendChild(existElement);
          }
          existElement.textContent = text;
        },
      });
      },
    [],
  )

  useEffect(() => {
    if (speechRecognition) {
      speechRecognition.onresult = (event) => {
        const current = event.resultIndex;
        const { transcript } = event.results[current][0];
        // setSubtitle(transcript)
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
