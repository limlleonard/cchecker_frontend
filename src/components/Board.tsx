import React from "react";
import styles from "./Board.module.css";
// import {Circle, Piece, Valid, Selected} from "./circles"

const diameterPiece = 30;
interface BaseProps {
    x: number;
    y: number;
    colorInd?: number;
    className?: string;
    onClick: (coords: { x: number; y: number }) => void;
}
const Base: React.FC<BaseProps> = ({ x, y, className, onClick }) => {
    return (
        <div
            className={className}
            onClick={() => onClick({ x, y })}
            style={{
                position: "absolute",
                width: `${diameterPiece}px`,
                height: `${diameterPiece}px`,
                left: `${x - diameterPiece / 2}px`,
                top: `${y - diameterPiece / 2}px`,
            }}
        ></div>
    );
};
const Circle: React.FC<BaseProps> = (props) => (
    <Base {...props} className={styles.circle} />
);
const Piece: React.FC<BaseProps> = (props) => (
    <Base
        {...props}
        className={`${styles.circle} ${styles.piece} ${
            styles[`farbe${props.colorInd}`]
        }`}
    />
);
const Valid: React.FC<BaseProps> = (props) => (
    <Base {...props} className={`${styles.circle} ${styles.valid}`} />
);
const Selected: React.FC<BaseProps> = (props) => (
    <Base
        {...props}
        className={`${styles.circle} ${styles.piece} ${styles.selected} ${
            styles[`farbe${props.colorInd}`]
        }`}
    />
);

interface BoardProps {
    spindown: boolean;
    arrCircle: [number, number][];
    aaFigur: [number, number][][];
    arrValid: [number, number][];
    selected: [number, number] | null;
    turnwise: number;
    onBoardClick: (coords: { x: number; y: number }) => void;
}

const Board: React.FC<BoardProps> = ({
    spindown,
    arrCircle,
    aaFigur,
    arrValid,
    selected,
    turnwise: order,
    onBoardClick,
}) => {
    return (
        <div className={styles.board} id="board">
            {spindown ? (
                <h3 className={styles.spindown}>
                    Backend is spinned off, please refresh
                </h3>
            ) : (
                <>
                    {arrCircle.map(([x, y]) => (
                        <Circle
                            key={`circle-${x}-${y}`}
                            x={x}
                            y={y}
                            onClick={onBoardClick}
                        />
                    ))}
                    {aaFigur.map((arrFigur, nrSpieler) =>
                        arrFigur.map(([x, y]) => (
                            <Piece
                                key={`piece-${nrSpieler}-${x}-${y}`}
                                x={x}
                                y={y}
                                colorInd={nrSpieler}
                                onClick={onBoardClick}
                            />
                        ))
                    )}
                    {arrValid.map(([x, y]) => (
                        <Valid
                            key={`valid-${x}-${y}`}
                            x={x}
                            y={y}
                            onClick={onBoardClick}
                        />
                    ))}
                    {selected && (
                        <Selected
                            x={selected[0]}
                            y={selected[1]}
                            colorInd={order}
                            onClick={onBoardClick}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default Board;
