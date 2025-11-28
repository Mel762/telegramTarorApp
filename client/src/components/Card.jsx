import './Card.css';

const Card = ({ name, image, position, isRevealed, onReveal }) => {
    return (
        <div className={`tarot-card ${isRevealed ? 'revealed' : ''}`} onClick={onReveal}>
            <div className="tarot-card__inner">
                <div className="tarot-card__front">
                    {image ? (
                        <img src={image} alt={name} className="card-image" />
                    ) : (
                        <div className="card-placeholder">
                            <span>{name}</span>
                        </div>
                    )}
                </div>
                <div className="tarot-card__back">
                    <div className="back-pattern"></div>
                </div>
            </div>
        </div>
    );
};

export default Card;
