import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[14px] font-sans font-bold transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-ink text-cream shadow-md hover:opacity-90',
        primary: 'bg-gradient-to-br from-gold-soft to-ember text-[#3a2205] shadow-md hover:opacity-90',
        outline:
          'bg-transparent border border-hair text-ink hover:bg-cream-2/50 shadow-sm',
        secondary:
          'bg-cream-2 text-ink hover:bg-hair/30',
        ghost:
          'text-muted-ink hover:bg-hair/50 hover:text-ink',
        destructive:
          'bg-maroon/10 text-maroon hover:bg-maroon/20',
        link: 'text-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[42px] px-4 py-[10px] text-[14px] [&_svg:not([class*=\'size-\'])]:size-4 gap-2',
        sm: "h-[36px] px-3 py-2 text-[13px] rounded-xl [&_svg:not([class*=\'size-\'])]:size-[14px] gap-1.5",
        lg: 'h-[48px] px-6 py-3 text-[15px] [&_svg:not([class*=\'size-\'])]:size-5 gap-2',
        icon: 'size-9 rounded-xl',
        'icon-sm': 'size-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
