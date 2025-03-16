import type { FC } from 'react';
import cn from '@/utils/classnames';

type Option = {
  value: string;
  text: string;
};

type TabSliderProps = {
  className?: string;
  itemWidth?: number;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
};

const TabSlider: FC<TabSliderProps> = ({
  className,
  itemWidth = 118,
  value,
  onChange,
  options,
}) => {
  // تصفية الخيارات لحذف زر "API Access"
  const filteredOptions = options.filter(option => option.value !== 'api-access');
  
  const currentIndex = filteredOptions.findIndex(option => option.value === value);
  const current = filteredOptions[currentIndex];

  return (
    <div className={cn(className, 'relative flex p-0.5 rounded-lg bg-gray-200')}>
      {
        filteredOptions.map((option, index) => (
          <div
            key={option.value}
            className={`
              flex justify-center items-center h-7 text-[13px] 
              font-semibold text-gray-600 rounded-[7px] cursor-pointer
              hover:bg-gray-50
              ${index !== filteredOptions.length - 1 && 'mr-[1px]'}
            `}
            style={{
              width: itemWidth,
            }}
            onClick={() => onChange(option.value)}
          >
            {option.text}
          </div>
        ))
      }
      {
        current && (
          <div
            className={`
              absolute flex justify-center items-center h-7 bg-white text-[13px] font-semibold text-primary-600 
              border-[0.5px] border-gray-200 rounded-[7px] shadow-xs transition-transform
            `}
            style={{
              width: itemWidth,
              transform: `translateX(${currentIndex * itemWidth + 1}px)`,
            }}
          >
            {current.text}
          </div>
        )
      }
    </div>
  );
};

export default TabSlider;
