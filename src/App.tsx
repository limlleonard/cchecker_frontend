import { useEffect, useState } from "react"; // useRef
import './App.css'
import Board from './Board';

// const devMode=import.meta.env.MODE==='development'
let url0 = '';
let url0ws = '';
if (window.location.protocol === 'http:') {
	url0 = 'http://127.0.0.1:8000/'
	url0ws = 'ws://127.0.0.1:8000/'
} else {
	url0 = `https://${window.location.hostname.replace("frontend", "backend")}/`
	url0ws = `wss://${window.location.hostname.replace("frontend", "backend")}/`
}

function App() {
	// const [count, setCount] = useState(0)
	// const timerRef = useRef<HTMLDivElement>(null);
	const [movenr, setMovenr] = useState(0);
	// const [seconds, setSeconds] = useState(0);
	// const [timerInterval, setTimerInterval] = useState<number | null>(null);
	const [selected, setSelected] = useState<[number, number] | null>(null);
	const [arrCircle, setArrCircle] = useState<[number, number][]>([]);
	const [aaFigur, setAAFigur] = useState<[number, number][][]>([]); // array of array of figur
	const [arrValid, setArrValid] = useState<[number, number][]>([]);
	const [turnwise, setTurnwise] = useState<number>(0);
	const [nrPlayer, setNrPlayer] = useState<number>(1);
	const [aktiv, setAktiv] = useState<boolean>(false); // if a game is running

	const initialRoomNr = Math.floor(Math.random() * 100); // Generate random number between 0-9
	const [roomnr, setRoomnr] = useState<number>(initialRoomNr);
	const [roomnrShow, setRoomnrShow] = useState<string>(initialRoomNr.toString());

	const [wsGame1, setWsGame1] = useState<WebSocket | null>(null);

	const starten = async () => {
		try {
			const response = await fetch(`${url0}starten/`, {
				method: "POST",
				headers: { "Content-Type": "application/json", },
				body: JSON.stringify({ nrPlayer, roomnr }),
			});
			const data = await response.json();
			const llPiece: [number, number][][] = data.ll_piece;
			setAAFigur(llPiece);
			setAktiv(true);
			// }
			initSocket();
		} catch (err) {
			console.error("Error starten:", err);
		}
	};
	const loadJoin = async () => {
		try {
			const response = await fetch(`${url0}reload_state/?roomnr=${roomnr}`, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await response.json();
			if (!data.exist) {
				alert(`No game is saved for the room number ${roomnr}. Please create a new one by clicking Start`)
			} else {
				setAAFigur(data.ll_piece);
				setTurnwise(data.turnwise);
				setMovenr(data.movenr);
				setAktiv(true);
			}
			initSocket();
		} catch (err) {
			console.error("Error by reloading state:", err);
		}
	};
	const reset = async () => {
		setMovenr(0);
		setTurnwise(0);

		initBoard1();
		setSelected(null);
		setAAFigur([]);
		setArrValid([]);
		setAktiv(false);
		try {
			const response = await fetch(`${url0}reset/`, {
				method: "POST",
				headers: { "Content-Type": "application/json", },
				body: JSON.stringify({ roomnr }),
			});
			const data = await response.json();
			if (!data.ok) console.log("Error by reset");
		} catch (err) {
			console.error("Error reset:", err);
		}
		const tempRoomnr: number = Math.floor(Math.random() * 100);
		setRoomnrShow(tempRoomnr.toString());
		setRoomnr(tempRoomnr);
	};
	const ward = async (direction: boolean) => {
		try {
			const response = await fetch(`${url0}ward/`, {
				method: "POST",
				headers: { "Content-Type": "application/json", },
				body: JSON.stringify({ direction, roomnr, movenr }),
			});
			const data = await response.json();
			if (data.moved) {
				if (wsGame1) wsGame1.send(JSON.stringify(data));
			}
		} catch (err) {
			console.error("Error ward:", err);
		}
	};
	const initBoard1 = async () => {
		try {
			const response = await fetch(`${url0}return_board/`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				throw new Error("Received non-JSON response");
			}
			const lstBoard: [number, number][] = await response.json();
			const lstBoardRound: [number, number][] = lstBoard.map(
				([x, y]: [number, number]) => [Math.round(x), Math.round(y)]);
			setArrCircle(lstBoardRound);
		} catch (err) {
			console.error("Error init board:", err);
		}
	};
	const roomInfo = async () => {
		try {
			const response = await fetch(`${url0}room_info/`, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await response.json();
			alert(`Saved games: ${data.lst_roomnr}.`)
		} catch (err) {
			console.error("Error by reloading state:", err);
		}
	}
	const test1 = async () => {
		alert("Du bist aber neugierig ;)")
	}
	const handleBoardClick = async (coords: { x: number; y: number }) => {
		if (!aktiv) return
		const xr = coords.x;
		const yr = coords.y;
		try {
			const response = await fetch(`${url0}klicken/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ xr, yr, roomnr }),
			});
			const data = await response.json();
			if (wsGame1) wsGame1.send(JSON.stringify(data));
		} catch (err) {
			console.error("Error during klicken:", err);
		}
	}
	const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setNrPlayer(parseInt(e.target.value))
	}
	useEffect(() => {
		initBoard1();

		if (wsGame1) {
			wsGame1.onmessage = (event) => {
				const data = JSON.parse(event.data);
				console.log(data);
			};
		}
	}, []);

	const initSocket = () => {
		if (wsGame1) {
			wsGame1.close();
		}
		const newWs = new WebSocket(`${url0ws}ws/game1/?roomnr=${roomnr}`);
		newWs.onopen = () => console.log(`Connected to room ${roomnr}`);
		newWs.onmessage = (event) => {
			const data = JSON.parse(event.data); // Convert JSON string to an object
			setSelected(null);
			if (data.selected.length > 0) {
				setSelected([data.selected[0], data.selected[1]]);
			}
			setArrValid(data.valid_pos);
			if (data.ll_piece) {
				setAAFigur(data.ll_piece)
				// setMovenr((prev) => prev+1);
				setMovenr(data.movenr)
				setTurnwise(data.turnwise)
				if (data.win > 0) {
					// setAktiv(false)
					alert(`Player ${data.win} wins!`)
				};
			}
		};
		newWs.onclose = () => console.log(`WebSocket closed for room ${roomnr}`);
		setWsGame1(newWs);
		return () => {
			newWs.close();
		};
	}

	return (
		<>
			<div className="ctn0">
				<section className="side-bar">
					<h1>Chinese Checker</h1>
					<div className="ctn-select">
						<label htmlFor="nrPlayer">Nr of players: </label>
						<select name="nrPlayer" id="nrPlayer" onChange={handleSelect} value={nrPlayer}>
							<option value="1">1</option>
							<option value="2">2</option>
							<option value="3">3</option>
						</select>
					</div>
					<div className="ctn-input">
						<label htmlFor="roomnr">Room number: </label>
						<input
							type="text"
							id="roomnr"
							name="roomnr"
							value={roomnrShow}
							onChange={(e) => setRoomnrShow(e.target.value)}
							onBlur={(e) => setRoomnr(Number(e.target.value) || 0)}
						/>
					</div>
					<div id="ctn-btn">
						<button onClick={starten} title="Start a new game">Start</button>
						<button onClick={loadJoin} title="Reload the saved game or join a game">Load / Join</button>
						<button onClick={reset} title="Reset the game">Reset</button>
						<button onClick={roomInfo} title="Get room information from the backend">Room Info</button>
						<button onClick={() => ward(false)} title="Backward">{"<<<"}</button>
						<button onClick={() => ward(true)} title="Forward">{">>>"}</button>
					</div>
					{/* <p>Timer: <span id="timer" ref={timerRef}>{formatTime(seconds)}</span></p> */}
					<p>Number of moves: <span id="nrMoves">{movenr}</span></p>
					<p>Player in turn: <span className={`circleSmall farbe${turnwise}`}></span></p>
					<a href="https://github.com/limlleonard/cchecker_frontend" target="_blank">Link to source code</a>
					<br />
					<button onClick={test1}>Test1</button>

				</section>
				<Board
					arrCircle={arrCircle}
					aaFigur={aaFigur}
					arrValid={arrValid}
					selected={selected}
					turnwise={turnwise}
					onBoardClick={handleBoardClick}
				/>
			</div>
		</>
	)
}

export default App
