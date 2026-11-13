import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { dialingCountries } from '@/lib/registration';

const referenceOrder = ['SN', 'CI', 'BJ', 'BF', 'CM', 'FR', 'GN', 'ML', 'NE', 'TG'];
const countries = referenceOrder.map((id) => dialingCountries.find((entry) => entry.id === id)!);

function Flag({ id }: { id: string }) {
  return <span className={`ig-flag ig-flag-${id}`} aria-hidden="true">
    {['SN', 'CM', 'BF', 'TG'].includes(id) && <svg viewBox="0 0 20 20"><path d="m10 1 2.1 6.3h6.6l-5.4 3.9 2.1 6.3-5.4-3.9-5.4 3.9 2.1-6.3L1.3 7.3h6.6z" /></svg>}
  </span>;
}

export function CountrySelect({ value, onChange, invalid, displayCountry = false }: {
  value: string; onChange: (value: string) => void; invalid: boolean; displayCountry?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = countries.find((entry) => entry.id === value);
  const choose = (index: number) => {
    onChange(countries[index].id);
    setOpen(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => {
    if (open) root.current?.querySelector(`#country-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setActive((current) => event.key === 'Home' ? 0 : event.key === 'End' ? countries.length - 1 :
        (current + (event.key === 'ArrowDown' ? 1 : -1) + countries.length) % countries.length);
    } else if (open && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      choose(active);
    }
  };
  return <div className="ig-country-wrap" ref={root}>
    <div className="ig-field ig-country-field">
      <button ref={trigger} id="country" type="button" role="combobox" aria-haspopup="listbox"
        aria-expanded={open} aria-controls={open ? 'country-options' : undefined}
        aria-activedescendant={open ? `country-option-${active}` : undefined}
        aria-labelledby="country-label" aria-invalid={invalid} data-testid="input-country"
        onKeyDown={keyboard} onClick={() => {
          if (!open) setActive(Math.max(0, countries.findIndex((entry) => entry.id === value)));
          setOpen(!open);
        }}>
         {selected ? displayCountry
           ? <span className="ig-country-selected"><Flag id={selected.id}/><span>{selected.name} ({selected.dialCode})</span></span>
           : selected.dialCode
           : 'Veuillez sélectionner votre pays'}
      </button>
    </div>
    {open && <div id="country-options" className="ig-country-menu" role="listbox" aria-labelledby="country-label">
      {countries.map((entry, index) => <div key={entry.id} id={`country-option-${index}`}
        role="option" aria-selected={entry.id === value}
        className={`ig-country-option${active === index ? ' is-active' : ''}`}
        onPointerMove={() => setActive(index)} onClick={() => choose(index)}>
        <Flag id={entry.id} /><span>{entry.name}({entry.dialCode})</span>
      </div>)}
    </div>}
  </div>;
}
