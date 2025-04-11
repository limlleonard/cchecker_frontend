import styles from "./PlayerSelect.module.css";

type PlayerSelectProps = {
    nrPlayer: number;
    setNrPlayer: (value: number) => void;
};

const PlayerSelect: React.FC<PlayerSelectProps> = ({
    nrPlayer,
    setNrPlayer,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNrPlayer(parseInt(e.target.value));
    };

    return (
        <div className={styles["ctn-select"]}>
            <label htmlFor="nrPlayer">Nr of players: </label>
            <select
                name="nrPlayer"
                id="nrPlayer"
                onChange={handleChange}
                value={nrPlayer}
            >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
            </select>
        </div>
    );
};
export default PlayerSelect;
