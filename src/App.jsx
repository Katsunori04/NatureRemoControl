import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [roomTemp, setRoomTemp] = useState(0);
  const [airConState, setAirConState] = useState("off");
  const [airConTemp, setAirConTemp] = useState(0);
  const [airConMode, setAirConMode] = useState("auto");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "https://api.nature.global/1/";
  const AIRCON_ID = "1fd95ff3-3036-47ab-a9a9-62a479cc9805";
  const API_KEY = import.meta.env.VITE_API_KEY;
  const ACCESS_TOKEN = `Bearer ${API_KEY}`;

  const headers = {
    Authorization: ACCESS_TOKEN,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const fetchDevices = async () => {
    try {
      const devices = await axios.get(API_BASE_URL + "devices", {
        headers: headers,
      });

      const appliances = await axios.get(API_BASE_URL + "appliances", {
        headers: headers,
      });

      setRoomTemp(devices.data[1].newest_events.te.val); //リビングの温度を取得

      console.log(appliances.data[5]);

      setAirConState(appliances.data[5].settings.button); // 洋室airconの電源状態を取得
      setAirConTemp(Number(appliances.data[5].settings.temp)); //洋室airconの設定温度を取得
      setAirConMode(appliances.data[5].settings.mode); //洋室airconの設定モードを取得

      console.log(Number(appliances.data[5].settings.temp));

      setError(null);
    } catch (err) {
      console.error("Error fetching devices:", err);
      setError(`デバイスの取得中にエラーが発生しました : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const PowerOFF = async () => {
    const params = new URLSearchParams({
      button: "power-off",
    });

    const res = await axios.post(
      API_BASE_URL + `appliances/${AIRCON_ID}/aircon_settings`,
      params,
      {
        headers: {
          ...headers,
        },
      },
    );

    if (res.status === 200) {
      setAirConState("power-off");
      console.log(`status : ${res.status}, send : powerOFF`);
    } else {
      console.error("Error PowerOFF");
    }
  };

  const UpdateMode = async (newMode) => {
    // modeを受け取って更新する
    // 表示を変える setAirConMode
    // APIに信号を送る
    let temp = 0;
    if (newMode == "auto") {
      //設定と室温差分が -2以下なら -2にする、 +2以上なら +2にする
      if (Number(roomTemp) - Number(airConTemp) <= -2) {
        temp = -2;
      } else if (Number(roomTemp) - Number(airConTemp) >= 2) {
        temp = 2;
      }
      console.log(temp);
    } else {
      // auto以外のモードの場合
      if (airConTemp == 0) {
        // autoモードからの切り替えの場合
        temp = 27;
      } else {
        // それ以外の場合
        temp = Number(airConTemp);
      }
      console.log(temp);
    }

    const params = new URLSearchParams({
      button: "power-on",
      operation_mode: newMode,
      temperature: String(temp),
    });

    const res = await axios.post(
      API_BASE_URL + `appliances/${AIRCON_ID}/aircon_settings`,
      params,
      {
        headers: {
          ...headers,
        },
      },
    );

    if (res.status === 200) {
      setAirConMode(newMode);
      setAirConState("power-on");
      console.log(`status : ${res.status}, UpdateMode : ${newMode}`);
    } else {
      console.error("Error UpdateMode");
    }
  };

  const UpdateTemp = async (newTemp) => {
    // tempを受け取って更新する
    // 表示を変える setAirConTemp
    // APIに信号を送る

    setAirConTemp(newTemp);

    const params = new URLSearchParams({
      button: "power-on",
      temperature: String(newTemp),
    });

    const res = await axios.post(
      API_BASE_URL + `appliances/${AIRCON_ID}/aircon_settings`,
      params,
      {
        headers: {
          ...headers,
        },
      },
    );

    console.log(`status : ${res.status}, UpdateTemp : ${newTemp}`);
  };

  useEffect(() => {
    fetchDevices();

    const interval = setInterval(() => {
      fetchDevices();
    }, 100000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6">
        {loading ? (
          <p className="text-center text-gray-500">
            データを読み込んでいます...
          </p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div />
        )}

        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          洋室
        </h2>
        <div className="mb-6">
          <div className="mb-4">
            <p className="text-xl font-semibold text-gray-600">室温</p>
            <p className="text-2xl text-gray-900">{roomTemp}℃</p>
          </div>
          <div className="mb-4">
            <p className="text-xl font-semibold text-gray-600">状態</p>
            <p className="text-lg text-gray-900">
              電源 : {airConState === "power-on" ? "ON" : "OFF"}
            </p>
            <p className="text-lg text-gray-900">モード：{airConMode}</p>
          </div>

          <div className="flex space-x-4 mb-6 justify-center">
            <button
              onClick={() => UpdateMode("auto")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
            >
              Auto
            </button>
            <button
              onClick={() => UpdateMode("cool")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
            >
              Cool
            </button>
            <button
              onClick={() => UpdateMode("warm")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
            >
              Heat
            </button>
            <button
              onClick={() => UpdateMode("dry")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
            >
              Dry
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-6 justify-center">
            <button
              onClick={() => UpdateTemp(airConTemp + 0.5)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-green-600"
            >
              +
            </button>
            <input
              type="text"
              value={airConTemp}
              readOnly
              className="w-16 text-center py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => UpdateTemp(airConTemp - 0.5)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-red-600"
            >
              -
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={PowerOFF}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600"
          >
            OFF
          </button>
          <button
            onClick={fetchDevices}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600"
          >
            データを再取得
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
