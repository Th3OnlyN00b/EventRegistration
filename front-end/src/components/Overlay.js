import { Fragment } from "react";

import "./Overlay.css";

export function Overlay({ isOpen, onClose, children }) {
    return (
        <Fragment>
            {isOpen && (
                <div className="overlay">
                    <div className="overlay__background" onClick={onClose} />
                    <div className="overlay__container-container" onClick={(e) => {if(e.target === e.currentTarget){onClose()}}}>
                        <div className="overlay__container">
                            <div className="overlay__controls">
                                <button
                                    className="overlay__close"
                                    type="button"
                                    onClick={onClose}
                                />
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    );
}

export default Overlay;