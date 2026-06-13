import { InputText } from '@stellar-ui-kit/web';

type MoneyInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
};

const formatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function MoneyInput({
  value,
  onChange,
  placeholder = '0,00',
  ...rest
}: MoneyInputProps) {
  const display = value === null ? '' : formatter.format(value);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 15);
    onChange(digits ? Number(digits) / 100 : null);
  };

  return (
    <InputText
      {...rest}
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
    />
  );
}
