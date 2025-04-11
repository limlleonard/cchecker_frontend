import React from "react";
import styles from "./RoomInput.module.css";

type RoomInputProps = {
    roomnrShow: string;
    setRoomnrShow: (value: string) => void;
    setRoomnr: (value: number) => void;
};

const RoomInput: React.FC<RoomInputProps> = ({
    roomnrShow,
    setRoomnrShow,
    setRoomnr,
}) => {
    return (
        <div className={styles["ctn-input"]}>
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
    );
};

export default RoomInput;
