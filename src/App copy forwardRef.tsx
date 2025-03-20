import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

import './App.css'

const diameterPiece = 30;
interface CircleProps {
	x: number;
	y: number;
	// setValidRef: (makeValid: () => void) => void;
}
interface CircleRef {
	setValid: (value: boolean) => void;
	setPiece: (value: number) => void;
}
const Circle = forwardRef<CircleRef, CircleProps>(({ x, y }, ref) => {
// const Circle: React.FC<CircleProps> = ({x, y}) => {
	const [valid, setValid]=useState(false);
	const [piece, setPiece]=useState(0);
	const klicken = () => {
		setValid(true);
	};

	useImperativeHandle(ref, () => ({
		setValid, setPiece,

	}));
	return (
		<>
		<div
			className={`circle ${valid ? 'valid' : ''} ${piece > 0 ? `piece color${piece}` : ''}`}
			onClick={klicken}
			style={{
				left: `${x - diameterPiece / 2}px`,
				top: `${y - diameterPiece / 2}px`,
			}}
			></div>
		</>
	)
});

function App() {
	// const [count, setCount] = useState(0)
	const boardRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<HTMLDivElement>(null);
    // const circleRef = useRef<Record<string, HTMLDivElement | null>>({});
	const circleRefs = useRef<{ [key: string]: CircleRef | null }>({});

	const [nrMoves, setNrMoves] = useState(0);
	const [seconds, setSeconds] = useState(0);
	const [arrValid, setArrValid] = useState<[number,number][]>([]);
	const [arrPiece, setArrPiece] = useState<[number,number][]>([]);
	const [timerInterval, setTimerInterval] = useState<number | null>(null);
	const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
	const [circles, setCircles] = useState<[number,number][]>([]);

	const url0='http://127.0.0.1:8000/';

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	const startTimer = () => {
		if (timerInterval) return;
		const interval = setInterval(() => {
			setSeconds((prev) => prev + 1);
		}, 1000);
		setTimerInterval(interval);
		console.log(nrMoves, selectedPiece);
	};

	const stopTimer = () => {
		if (timerInterval) clearInterval(timerInterval);
		setTimerInterval(null);
	};

	const resetTimer = () => {
		stopTimer();
		setSeconds(0);
	};

	const createCircle = (x: number, y: number, colorIndex: number) => {
		const circle = document.createElement("div");
		const xr = Math.round(x);
		const yr = Math.round(y);

		// circle.className = colorIndex === 0 ? "circle" : "piece";
		circle.className=`circle ${arrValid.some(([xc, yc]) => xc === xr && yc === yr) ? "valid" : ""} ${colorIndex===0 ? "" : "piece"}`;
		circle.style.left = `${x - diameterPiece / 2}px`;
		circle.style.top = `${y - diameterPiece / 2}px`;
		circle.id = `${xr}-${yr}-${colorIndex}`;
		circle.addEventListener("click", () => klicken(xr, yr, colorIndex));
		boardRef.current?.appendChild(circle);
	};

	const removePiece = (x: number, y: number, colorIndex: number) => {
		const piece = document.getElementById(`${x}-${y}-${colorIndex}`);
		piece?.remove();
	};

	const resetValid = () => {
		document.querySelectorAll(".circle").forEach((circle) => {
			circle.classList.remove("valid");
		});
		document.querySelectorAll(".piece").forEach((piece) => {
			piece.classList.remove("selected");
		});
	};

	const movePiece = (xrFrom: number, yrFrom: number, colorIndex: number, xrTo: number, yrTo: number) => {
		removePiece(xrFrom, yrFrom, colorIndex);
		createCircle(xrTo, yrTo, colorIndex);
		setSelectedPiece(null);
		setNrMoves((prev) => prev + 1);
		if (!timerInterval) startTimer();
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
			// lstBoard.forEach(([x, y]) => createCircle(x, y, 0));
			const lstBoardRound:[number, number][]= lstBoard.map(([x, y]:[number, number]) => [Math.round(x), Math.round(y)]);
			setCircles(lstBoardRound);
		} catch (err) {
			console.error("Error fetching board data:", err);
		}
	};

	const initPieces1 = async () => {
		try {
			const response = await fetch(`${url0}return_pieces/`);
			const lstPiece: [number, number][] = await response.json();
			setArrPiece(lstPiece);
			// lstPiece.map(([x, y]:[number, number]) => {
			// 	const xr=Math.round(x);
			// 	const yr=Math.round(y);
			// });
			// lstPiece.forEach(([x, y]) => createCircle(x, y, 1));
		} catch (err) {
			console.error("Error fetching pieces:", err);
		}
	};
	const test1 = () => {
		arrPiece.forEach(([x, y]) => {
			const key = `${x}-${y}`;
			if (circleRefs.current[key]) {
				circleRefs.current[key]?.setPiece(1);
			}
		});

	}
	const klicken = async (xr: number, yr: number, colorIndex: number) => {
		try {
			const response = await fetch(`${url0}klicken/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ xr, yr }),
			});
			const result = await response.json();
			resetValid();
			if (result.selected) {
				const piece = document.getElementById(`${xr}-${yr}-${colorIndex}`);
				piece?.classList.add("selected");
			}
			setArrValid(result.validPos);

			if (result.coordTo) {
				movePiece(result.coordFrom[0], result.coordFrom[1], 1, result.coordTo[0], result.coordTo[1]);
			}
		} catch (err) {
			console.error("Error during klicken:", err);
		}
	};

	useEffect(() => {
		arrValid.forEach(([xr, yr]: [number, number]) => {
			const circle = document.getElementById(`${xr}-${yr}-0`);
			circle?.classList.add("valid");
		});
	}, [arrValid]);

	useEffect(() => {
		initBoard1();
		initPieces1();
		return () => stopTimer(); // Cleanup on unmount
	}, []);

	useEffect(() => {
		if (timerRef.current) {
			timerRef.current.textContent = formatTime(seconds);
		}
	}, [seconds]);

	return (
		<>
		<div className="ctn0">
			<section className="side-bar">
				<h1>Sternhalma</h1>
				<div id="ctn-timer">
					<p  title="Timer will start when you make the first move.">Timer: </p>
					<p id="timer" ref={timerRef}>0:00</p><br/>
				</div>
				<div id="ctn-btn">
					<button onClick={startTimer}>Start</button>
					<button onClick={stopTimer}>Stop</button>
					<button onClick={resetTimer}>Reset</button>
				</div>
				<div id="ctn-counter">
					<p>Number of moves: </p>
					<p id="nrMoves">0</p>
				</div>
				<button onClick={test1}>Test1</button>
			</section>
			<div className="board" id="board" ref={boardRef}>
				{circles.map(([x, y]) => (
					<Circle key={`${x}-${y}`} x={x} y={y} ref={(el) => {(circleRefs.current[`${x}-${y}`] = el)}}/>
				))}
			</div>
		</div>
		</>
	)
}

export default App

// Dynamic Refs Storage: useRef<{ [key: string]: CircleRef | null }> creates an object to hold references to all Circle components.
// Assigning Refs: The ref prop is set using an inline function to dynamically store each Circle component by its key (x-y).
// Accessing Specific Circle: The handleSetValid function takes coordinates and calls setValid(true) on the correct circle.
