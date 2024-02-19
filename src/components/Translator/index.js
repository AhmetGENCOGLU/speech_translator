/* eslint-disable no-undef */
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import "./style.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faMicrophone,
  faRetweet,
  faVolumeMute,
  faVolumeUp,
} from "@fortawesome/free-solid-svg-icons";
import { TranslateService } from "../../services/translate";
import { Button, Select, Tooltip } from "antd";
import {
  languageOptions,
  localStorageFromToKey,
  subtitleClassname,
} from "../../constants";
import { setFromToInitialValues } from "../../utils/helpers";

const Translator = () => {
  const [listening, setListening] = useState(false);
  let [from, setFrom] = useState(setFromToInitialValues("from", "tr"));
  let [to, setTo] = useState(setFromToInitialValues("to", "en"));
  const [muted, setMuted] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(true);

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
      speechSynthesis.speak(speechSynthesisUtterance);
    },
    [speechSynthesisUtterance]
  );

  useEffect(() => {
    if (speechRecognition && from) {
      speechRecognition.lang = from;
    }
  }, [speechRecognition, from]);

  useEffect(() => {
    if (speechSynthesisUtterance && to) {
      speechSynthesisUtterance.lang = to;
    }
  }, [speechSynthesisUtterance, to]);

  const setSubtitle = useCallback(async (text) => {
    let [tab] = await chrome.tabs.query({ active: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text, subtitleClassname) => {
        let subtitleElement = document.querySelector(`.${subtitleClassname}`);
        if (!subtitleElement) {
          subtitleElement = document.createElement("div");
          subtitleElement.classList.add(subtitleClassname);
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
  }, []);

  const translate = useCallback(
    (value) => {
      if (!value || (muted && !showSubtitle)) return;

      translateService
        .translate({
          from,
          to,
          q: value,
        })
        .then((response) => {
          const text = response.data[0];
          if (!muted) {
            speak(text);
          }

          if (showSubtitle) {
            setSubtitle(text);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    },
    [from, muted, setSubtitle, showSubtitle, speak, to, translateService]
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
  }, [speechRecognition, translate]);

  const onClickMicrophone = () => {
    if (listening) {
      speechRecognition.stop();
      setListening(false);
    } else {
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

  const setMicrophoneIconColor = () => (listening ? "red" : "black");

  const setSubtitleIconColor = () => (showSubtitle ? "red" : "black");

  const setAudioIcon = () =>
    muted ? (
      <FontAwesomeIcon icon={faVolumeMute} color="red" />
    ) : (
      <FontAwesomeIcon icon={faVolumeUp} color="green" />
    );

  const onClickAudioButton = () => {
    setMuted((prevState) => !prevState);
  };

  const onClickSubtitleButton = () => {
    setShowSubtitle((prevState) => !prevState);
  };

  const filterLangOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

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
          listHeight={100}
          filterOption={filterLangOption}
          optionFilterProp="children"
        />
        <Button onClick={onClickReplaceFromAndTo}>
          <FontAwesomeIcon icon={faRetweet} />
        </Button>
        <Select
          showSearch
          placeholder="To"
          options={languageOptions}
          value={to}
          onChange={onChangeTo}
          listHeight={100}
          filterOption={filterLangOption}
          optionFilterProp="children"
        />
      </div>
      <div>
        <Button onClick={onClickMicrophone}>
          <FontAwesomeIcon
            icon={faMicrophone}
            color={setMicrophoneIconColor()}
          />
        </Button>
      </div>
      <div className="bottom_section">
        <Tooltip title="Audio" placement="topRight">
          <Button onClick={onClickAudioButton}>{setAudioIcon()}</Button>
        </Tooltip>
        <Tooltip title="Subtitle" placement="topRight">
          <Button onClick={onClickSubtitleButton}>
            <FontAwesomeIcon
              icon={faAlignLeft}
              color={setSubtitleIconColor()}
            />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default memo(Translator);
