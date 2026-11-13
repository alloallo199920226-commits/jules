import { IndustrialIcon, Minus, Plus } from '@/components/industrial-icons';

type QuantitySelectorProps = {
  quantityText: string;
  quantity: number | null;
  quantityLimit: number;
  onChange: (value: string) => void;
  onIncrement: (delta: number) => void;
  onBlur: () => void;
};

export function QuantitySelector({ quantityText, quantity, quantityLimit, onChange, onIncrement, onBlur }: QuantitySelectorProps) {
  return (
    <section className="product-dialog-quantity" aria-label="Quantité à investir">
      <IndustrialIcon name="excavator" size={57} className="product-dialog-quantity-art" aria-hidden="true" />
      <label htmlFor="product-quantity">Acheter des parts</label>
      <div className="product-dialog-stepper">
        <button
          type="button" className="product-dialog-step"
          onClick={() => onIncrement(-1)} disabled={quantity === null || quantity <= 1}
          aria-label="Retirer une part" data-testid="quantity-minus"
        ><Minus size={19} /></button>
        <input
          id="product-quantity" type="text" inputMode="numeric" pattern="[0-9]*" name="quantity"
          aria-label="Nombre de parts" value={quantityText} onChange={event => onChange(event.target.value)}
          onBlur={onBlur} data-testid="product-quantity"
        />
        <button
          type="button" className="product-dialog-step"
          onClick={() => onIncrement(1)} disabled={quantity !== null && quantity >= quantityLimit}
          aria-label="Ajouter une part" data-testid="quantity-plus"
        ><Plus size={19} /></button>
      </div>
    </section>
  );
}
