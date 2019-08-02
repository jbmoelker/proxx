/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import prerender from "consts:prerender";
import { strDifficulty } from "l20n:main";
import { Component, h } from "preact";
import {
  getPresetName,
  PresetName,
  presets
} from "src/main/services/state/grid-presets";
import { isFeaturePhone } from "src/main/utils/static-display";
import { bind } from "src/utils/bind";
import deferred from "../deferred";
import { Arrow } from "../icons/initial";
import {
  field as fieldStyle,
  intro as introStyle,
  label as labelStyle,
  labelText as labelTextStyle,
  numberDownArrow as numberDownArrowStyle,
  numberUpArrow as numberUpArrowStyle,
  selectArrow as selectArrowStyle,
  selectField as selectFieldStyle,
  settingsRow as settingsRowStyle,
  shortcutKey as shortcutKeyStyle,
  showbizIntro as showbizIntroStyle,
  showbizLoading as showbizLoadingStyle,
  startButton as startButtonStyle,
  startForm as startFormStyle
} from "./style.css";

type GridType = import("../../../preact-canvas").GridType;

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.

// tslint:disable-next-line: variable-name
const ShowbizTitleDeferred = deferred(
  new Promise(resolve => {
    if (!prerender) {
      resolve();
    }
  }).then(() => import("../../lazy-components").then(m => m.ShowbizTitle))
);

interface NumberFieldProps extends JSX.HTMLAttributes {
  inputRef: JSX.HTMLAttributes["ref"];
}

class NumberField extends Component<NumberFieldProps, {}> {
  private _input?: HTMLInputElement;

  render(props: NumberFieldProps) {
    const { children, inputRef, ...inputProps } = props;

    return (
      <label class={labelStyle}>
        <Arrow class={numberUpArrowStyle} onClick={this._onUpClick} />
        <Arrow class={numberDownArrowStyle} onClick={this._onDownClick} />
        <span class={labelTextStyle}>{props.children}</span>
        <input
          ref={el => {
            this._input = el;
            if (inputRef) {
              inputRef(el);
            }
          }}
          class={fieldStyle}
          type="number"
          inputmode="numeric"
          pattern="[0-9]*"
          {...inputProps}
        />
      </label>
    );
  }

  @bind
  private _onUpClick() {
    this._input!.valueAsNumber = Math.min(
      this._input!.valueAsNumber + 1,
      Number(this._input!.max)
    );
    this._dispatch();
  }

  @bind
  private _onDownClick() {
    this._input!.valueAsNumber = Math.max(
      this._input!.valueAsNumber - 1,
      Number(this._input!.min)
    );
    this._dispatch();
  }

  private _dispatch() {
    this._input!.dispatchEvent(new Event("change"));
  }
}

function getStateUpdateFromDefaults(defaults: GridType) {
  const { width, height, mines } = defaults;
  return {
    width,
    height,
    mines,
    presetName: getPresetName(width, height, mines)
  };
}

export interface Props {
  onStartGame: (width: number, height: number, mines: number) => void;
  defaults?: GridType;
  motion: boolean;
}

interface State {
  presetName?: PresetName | "custom";
  width?: number;
  height?: number;
  mines?: number;
}

// tslint:disable-next-line:max-classes-per-file
export default class Intro extends Component<Props, State> {
  private _presetSelect?: HTMLSelectElement;
  private _widthInput?: HTMLInputElement;
  private _heightInput?: HTMLInputElement;
  private _minesInput?: HTMLInputElement;

  constructor(props: Props) {
    super(props);
    if (props.defaults) {
      this.state = getStateUpdateFromDefaults(props.defaults);
    }
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    window.addEventListener("keyup", this._onKeyUp);
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this._onKeyUp);
  }

  componentWillReceiveProps({ defaults }: Props) {
    if (defaults && !this.props.defaults) {
      this.setState(getStateUpdateFromDefaults(defaults));
    }
  }

  render({ motion }: Props, { width, height, mines, presetName }: State) {
    return (
      <div class={introStyle}>
        <div class={showbizIntroStyle}>
          <ShowbizTitleDeferred
            loading={() => <div class={showbizLoadingStyle} />}
            // tslint:disable-next-line: variable-name
            loaded={ShowbizTitle => <ShowbizTitle motion={motion} />}
          />
        </div>
        <form
          onSubmit={this._startGame}
          class={startFormStyle}
          aria-label="game settings"
        >
          <div class={settingsRowStyle}>
            <label class={labelStyle}>
              <span class={labelTextStyle}>{strDifficulty}</span>
              <Arrow class={selectArrowStyle} />
              <select
                required
                class={selectFieldStyle}
                ref={el => (this._presetSelect = el)}
                onChange={this._onSelectChange}
                value={presetName || ""}
              >
                {presetName && [
                  <option value="easy">Easy</option>,
                  <option value="medium">Medium</option>,
                  <option value="hard">Hard</option>,
                  <option value="custom">Custom</option>
                ]}
              </select>
            </label>
          </div>
          <div class={settingsRowStyle}>
            <NumberField
              required
              min="5"
              max="40"
              step="1"
              value={width || ""}
              inputRef={el => (this._widthInput = el)}
              onChange={this._onSettingInput}
            >
              Width
            </NumberField>
            <NumberField
              required
              min="5"
              max="40"
              step="1"
              value={height || ""}
              inputRef={el => (this._heightInput = el)}
              onChange={this._onSettingInput}
            >
              Height
            </NumberField>
          </div>
          <div class={settingsRowStyle}>
            <NumberField
              required
              min="1"
              max={width && height ? width * height : ""}
              step="1"
              value={mines}
              inputRef={el => (this._minesInput = el)}
              onChange={this._onSettingInput}
            >
              Black holes
            </NumberField>
          </div>
          <div class={settingsRowStyle}>
            <button class={startButtonStyle}>
              {isFeaturePhone ? <span class={shortcutKeyStyle}>#</span> : ""}{" "}
              Start
            </button>
          </div>
        </form>
      </div>
    );
  }

  @bind
  private _onKeyUp(event: KeyboardEvent) {
    if (event.key === "#") {
      this._startGame(event);
    }
  }

  @bind
  private _onSelectChange() {
    const presetName = this._presetSelect!.value as PresetName | "custom";

    if (presetName === "custom") {
      this.setState({ presetName });
      return;
    }

    const preset = presets[presetName];

    this.setState({
      height: preset.height,
      mines: preset.mines,
      presetName,
      width: preset.width
    });
  }

  @bind
  private _onSettingInput() {
    const width = this._widthInput!.valueAsNumber;
    const height = this._heightInput!.valueAsNumber;
    const mines = this._minesInput!.valueAsNumber;
    const maxMines = width * height - 9;

    this.setState({
      height,
      mines: mines > maxMines ? maxMines : mines,
      presetName: getPresetName(width, height, mines),
      width
    });
  }

  @bind
  private _startGame(event: Event) {
    event.preventDefault();
    this.props.onStartGame(
      this.state.width!,
      this.state.height!,
      this.state.mines!
    );
  }
}
