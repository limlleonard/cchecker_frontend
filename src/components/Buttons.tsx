import styles from "./Buttons.module.css";
type GameActionsProps = {
    starten: () => void;
    loadJoin: () => void;
    reset: () => void;
    roomInfo: () => void;
    ward: (dir: boolean) => void;
};

const GameActions: React.FC<GameActionsProps> = ({
    starten,
    loadJoin,
    reset,
    roomInfo,
    ward,
}) => {
    return (
        <div id={styles["ctn-btn"]}>
            <button onClick={starten} title="Start a new game">
                Start
            </button>
            <button
                onClick={loadJoin}
                title="Reload the saved game or join a game"
            >
                Load / Join
            </button>
            <button onClick={reset} title="Reset the game">
                Reset
            </button>
            <button
                onClick={roomInfo}
                title="Get room information from the backend"
            >
                Room Info
            </button>
            <button onClick={() => ward(false)} title="Backward">
                {"<<<"}
            </button>
            <button onClick={() => ward(true)} title="Forward">
                {">>>"}
            </button>
        </div>
    );
};

export default GameActions;
