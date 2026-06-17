import { InputText } from '@stellar-ui-kit/web';
import { cn } from '@stellar-ui-kit/shared';
import { Loader2 } from 'lucide-react';

type MoneyInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
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
  loading = false,
  className,
  ...rest
}: MoneyInputProps) {
  const display = value === null ? '' : formatter.format(value);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 15);
    onChange(digits ? Number(digits) / 100 : null);
  };

  return (
    <div className='relative'>
      <InputText
        {...rest}
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        className={cn(loading && 'pr-9', className)}
      />
      {loading && (
        <Loader2 className='pointer-events-none absolute right-3 top-8 size-4 animate-spin text-muted' />
      )}
    </div>
  );
}
