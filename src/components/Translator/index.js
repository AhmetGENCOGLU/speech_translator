import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faRetweet } from "@fortawesome/free-solid-svg-icons";
import { TranslateService } from "../../services/translate";
import { Button, Select } from "antd";
import { languageOptions, localStorageFromToKey } from "../../constants";
import { setFromToInitialValues } from "../../utils/helpers";

const Translator = () => {
  const [listening, setListening] = useState(false);
  const [value, setValue] = useState("");
  const [translating, setTranslating] = useState(false);
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

  const translate = useCallback(() => {
    setTranslating(true);
    translateService
      .translate({
        from,
        to,
        q: value,
      })
      .then((response) => {
        speechSynthesisUtterance.text = response.data[0];
        speechSynthesisUtterance.lang = to;
        speechSynthesis.speak(speechSynthesisUtterance);
        setValue("");
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setTranslating(false);
      });
  }, [from, speechSynthesisUtterance, to, translateService, value]);

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
        translate();
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

  const isDisabledLanguageSelection = () => translating || listening;

  const isDisabledMicrophone = () => translating;

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
        />
      </div>
      <div>
        <Button onClick={onClickMicrophone} disabled={isDisabledMicrophone()}>
          <FontAwesomeIcon icon={faMicrophone} color={setMicrophoneColor()} />
        </Button>
      </div>
    </div>
  );
};

export default Translator;
