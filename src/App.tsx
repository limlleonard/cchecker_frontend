import { useEffect, useState } from "react"; // useRef
import './App.css'
import Board from './Board';

const devMode=import.meta.env.MODE==='development'
// const urlBackend='cchecker-backend.onrender.com/'
let urlBackend = '';
if (window.location.hostname === 'cchecker-frontend.onrender.com') {
    urlBackend = 'cchecker-backend.onrender.com/';
} else {
    urlBackend = 'cchecker-backend-docker.onrender.com/';
}
const url0=devMode ? 'http://127.0.0.1:8000/' : `https://${urlBackend}`;
// const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const url0ws = devMode 
    ? 'ws://127.0.0.1:8000/' 
    : `wss://${urlBackend}`;

interface ModelScore {
    id: number;
    score: number | string;
    name: string;
}
function App() {
	// const [count, setCount] = useState(0)
	// const timerRef = useRef<HTMLDivElement>(null);
	const [nrMoves, setNrMoves] = useState(0);
	// const [seconds, setSeconds] = useState(0);
	// const [timerInterval, setTimerInterval] = useState<number | null>(null);
	const [selected, setSelected] = useState<[number, number] | null>(null);
	const [arrCircle, setArrCircle] = useState<[number,number][]>([]);
	const [aaFigur, setAAFigur] = useState<[number,number][][]>([]); // array of array of figur
	const [arrValid, setArrValid] = useState<[number,number][]>([]);
	const [order, setOrder] = useState<number>(0);
	const [nrPlayer, setNrPlayer] = useState<number>(1);
    const [bestList, setBestList] = useState<ModelScore[]>([]);
	const [aktiv, setAktiv] = useState<boolean>(false); // if a game is running

    const initialRoomNr = Math.floor(Math.random() * 100); // Generate random number between 0-9
    const [roomnr, setRoomnr] = useState<number>(initialRoomNr);
    const [roomnrShow, setRoomnrShow] = useState<string>(initialRoomNr.toString());

	const [wsGame1, setWsGame1] = useState<WebSocket | null>(null);
	// const formatTime = (seconds: number) => {
	// 	const minutes = Math.floor(seconds / 60);
	// 	const remainingSeconds = seconds % 60;
	// 	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	// };

	const starten = async () => {
		// if (timerInterval) return;
		// const interval = setInterval(() => {
		// 	setSeconds((prev) => prev + 1);
		// }, 1000);
		// setTimerInterval(interval);
		try {
			const response = await fetch(`${url0}starten/`, {
				method: "POST",
				headers: {"Content-Type": "application/json",},
				body: JSON.stringify({ nrPlayer, roomnr }),
			});
			const data = await response.json();
			// if (data.exist) {
			// 	alert("The room is taken, please choose another room number");
			// } else {
			const llPiece: [number, number][][] = data.ll_piece;
			setAAFigur(llPiece);
			setAktiv(true);
			// }
			initSocket();
		} catch (err) {
			console.error("Error starten:", err);
		}
	};
	const saveState = async () => {
		try {
			const response = await fetch(`${url0}save_state/`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ roomnr }),
			});
			const data = await response.json();
			alert(data.message); // Show popup with response message

		} catch (err) {
			console.error("Error saving state:", err);
		}
	};
	const reloadState = async () => {
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
				alert(`No game is saved for the room number ${roomnr}`)
			} else {
				if (data.taken) {
					alert(`The room ${roomnr} is taken`)
				} else {
					setAAFigur(data.ll_piece);
					setOrder(data.order);
					setAktiv(true);
				}
			}
			initSocket();
		} catch (err) {
			console.error("Error by reloading state:", err);
		}
	};
	const reset = async () => {
		// if (timerInterval) clearInterval(timerInterval);
		// setTimerInterval(null);
		// setSeconds(0);
		// setNrMoves(0);
		setOrder(0);

		initBoard1();
		setSelected(null);
		setAAFigur([]);
		setArrValid([]);
		setAktiv(false);
		try {
			const response = await fetch(`${url0}reset/`, {
				method: "POST",
				headers: {"Content-Type": "application/json",},
				body: JSON.stringify({ roomnr }),
			});
			const data = await response.json();
			if (!data.ok) console.log("Error by reset");
		} catch (err) {
			console.error("Error reset:", err);
		}
		const tempRoomnr:number=Math.floor(Math.random() * 100);
		setRoomnrShow(tempRoomnr.toString());
		setRoomnr(tempRoomnr);
		// run a random for roomnr, delete the old instance in dct_game in backend
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
			const lstBoardRound:[number, number][]= lstBoard.map(
				([x, y]:[number, number]) => [Math.round(x), Math.round(y)]);
			setArrCircle(lstBoardRound);
		} catch (err) {
			console.error("Error init board:", err);
		}
	};
    const fetchScores = () => {
        fetch(`${url0}get_score/`)
            .then((response) => response.json())
            .then((apiData: ModelScore[]) => {
                const filledData = [
                    ...apiData,
                    ...Array.from({ length: Math.max(0, 5 - apiData.length) }, () => ({
                        id: Math.random(),
                        score: '---',
                        name: '----------',
                    })),
                ];
                setBestList(filledData);
            })
            .catch((error) => console.error('Error fetching data:', error));
    };
    const handleNewScore = (newScore: number) => {
        // Find the highest score in the array
        const scores = bestList
            .map((item) => (typeof item.score === 'number' ? item.score : -Infinity))
            .filter((score) => score !== -Infinity);
        const highestScore = scores.length > 0 ? Math.max(...scores) : -Infinity;

        if (newScore < highestScore || scores.length<5 ) {
            const name = prompt('Congratulations! Would you like to leave your name on the ranking:')?.trim();
            if (name && name.length <= 20) {
                fetch(`${url0}add_score/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ score: newScore, name }),
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Failed to add score');
                        }
                        return response.json();
                    })
                    .then(() => {
                        alert('Score added successfully!');
                        fetchScores(); // Refresh the scores
                    })
                    .catch((error) => {
                        console.error('Error adding score:', error);
                        alert('Error adding score. Please try again.');
                    });
            }
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
			alert(`Room taken: ${data.lst_roomnr_taken}. State saved: ${data.lst_roomnr_saved}.`)
		} catch (err) {
			console.error("Error by reloading state:", err);
		}
	}
	const test1 = async () => {
		// const score = parseInt(prompt('Enter a new score:') || '', 10);
		// if (!isNaN(score)) {
		// 	handleNewScore(score);
		// }
		alert("Du bist aber neugierig ;)")
	}
	const handleBoardClick = async (coords: { x: number; y: number }) => {
		if (!aktiv) return 
		const xr=coords.x;
		const yr=coords.y;
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
		fetchScores();

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
			if (data.selected) {
				setSelected([data.selected[0], data.selected[1]]);
			}
			setArrValid(data.validPos);
			if (data.neueFiguren) {
				setAAFigur(data.neueFiguren)
				setNrMoves((prev) => prev+1);
				setOrder(data.order)
				if (data.gewonnen) {
					handleNewScore(nrMoves)
					setAktiv(false)
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
					<button onClick={reset} title="Reset the game">Reset</button>
					<button onClick={saveState} title="Save the game with the room number">Save</button>
					<button onClick={reloadState} title="Reload the saved game with the room number">Reload</button>
					<button onClick={roomInfo} title="Get room information from the backend">Room Info</button>
				</div>
				{/* <p>Timer: <span id="timer" ref={timerRef}>{formatTime(seconds)}</span></p>
				<p>Number of moves: <span id="nrMoves">{nrMoves}</span></p> */}
				<p>Player in turn: <span className={`circleSmall farbe${order}`}></span></p>
				<a href="https://github.com/limlleonard/cchecker_frontend" target="_blank">Link to source code</a>
				<br />
				<button onClick={test1}>Test1</button>

			</section>
			<Board
				arrCircle={arrCircle}
				aaFigur={aaFigur}
				arrValid={arrValid}
				selected={selected}
				order={order}
				onBoardClick={handleBoardClick}
			/>
		</div>
		</>
	)
}

export default App

// farben auswählen, feld farbe
// Dynamic Refs Storage: useRef<{ [key: string]: CircleRef | null }> creates an object to hold references to all Circle components.
// Assigning Refs: The ref prop is set using an inline function to dynamically store each Circle component by its key (x-y).
// Accessing Specific Circle: The handleSetValid function takes coordinates and calls setValid(true) on the correct circle.

// score list, one should not be able to click on the circles unless the game is started
// test session, component reform for 4in1row, UI for invite code,
// On this session branch, it suppose to create a new game instance for each user.
// It works for the react build version, but not the react dev version.
// Also deploying on render success but got 500.

{/* <p>High score list:</p>
<table>
	<tbody>
		{bestList.map((item) => (
			<tr key={item.id}>
				<td>{item.score}</td>
				<td>{item.name}</td>
			</tr>
		))}
	</tbody>
</table> */}
