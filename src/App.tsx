import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface Category {
  name: string;
  weeklyHours: number;
  color: string;
}

interface CellData {
  category: string;
  color: string;
}

const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

const TOTAL_WEEKLY_HOURS = 24 * 7; // 24 hours per day * 7 days

const App = () => {
  const [categories, setCategories] = useState<Category[]>(() => {
    const storedCategories = localStorage.getItem('categories');
    return storedCategories ? JSON.parse(storedCategories) : [];
  });
  const [newCategory, setNewCategory] = useState<string>('');
  const [newCategoryWeeklyHours, setNewCategoryWeeklyHours] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [cellData, setCellData] = useState<{ [key: string]: CellData }>(() => {
    const storedCellData = localStorage.getItem('cellData');
    return storedCellData ? JSON.parse(storedCellData) : {};
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startHour = 7; // 7 AM
  const endHour = 24; // Midnight

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(formatTime(hour, 0));
      slots.push(formatTime(hour, 30));
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory && newCategoryWeeklyHours > 0) {
      const newCategoryObj: Category = {
        name: newCategory,
        weeklyHours: newCategoryWeeklyHours,
        color: generateRandomColor()
      };
      setCategories(prevCategories => [...prevCategories, newCategoryObj]);
      setNewCategory('');
      setNewCategoryWeeklyHours(0);
      categoryInputRef.current?.focus();
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    setCategories(prevCategories => {
      const updatedCategories = prevCategories.map((category, i) =>
        i === index ? { ...category, color: newColor } : category
      );
      localStorage.setItem('categories', JSON.stringify(updatedCategories));

      // Update selectedCategory if it's the one being changed
      if (selectedCategory && selectedCategory.name === updatedCategories[index].name) {
        setSelectedCategory(updatedCategories[index]);
      }

      return updatedCategories;
    });

    const categoryName = categories[index].name;
    setCellData(prevData => {
      const newData = { ...prevData };
      Object.keys(newData).forEach(key => {
        if (newData[key].category === categoryName) {
          newData[key].color = newColor;
        }
      });
      localStorage.setItem('cellData', JSON.stringify(newData));
      return newData;
    });
  };

  const handleCellUpdate = (day: string, time: string) => {
    const cellKey = `${day}-${time}`;
    if (selectedCategory) {
      setCellData(prevData => {
        const newData = { ...prevData };
        if (newData[cellKey] && newData[cellKey].category === selectedCategory.name) {
          delete newData[cellKey];
        } else {
          newData[cellKey] = { category: selectedCategory.name, color: selectedCategory.color };
        }
        return newData;
      });
    } else {
      setCellData(prevData => {
        const newData = { ...prevData };
        delete newData[cellKey];
        return newData;
      });
    }
  };

  const handleMouseDown = (day: string, time: string) => {
    setIsDragging(true);
    handleCellUpdate(day, time);
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (isDragging) {
      handleCellUpdate(day, time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRemoveSelection = () => {
    setSelectedCategory(null);
  };

  const calculateCategoryHours = (categoryName: string) => {
    const categorySlots = Object.values(cellData).filter(cell => cell.category === categoryName);
    return categorySlots.length * 0.5;
  };

  const handleClearCategory = (categoryName: string) => {
    setCellData(prevData => {
      const newData = { ...prevData };
      Object.keys(newData).forEach(key => {
        if (newData[key].category === categoryName) {
          delete newData[key];
        }
      });
      return newData;
    });
  };

  const handleClearAllCategories = () => {
    setCellData({});
  };

  const handleDeleteCategory = (categoryName: string) => {
    setCategories(prevCategories => {
      const updatedCategories = prevCategories.filter(cat => cat.name !== categoryName);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      return updatedCategories;
    });

    setCellData(prevData => {
      const newData = { ...prevData };
      Object.keys(newData).forEach(key => {
        if (newData[key].category === categoryName) {
          delete newData[key];
        }
      });
      localStorage.setItem('cellData', JSON.stringify(newData));
      return newData;
    });

    if (selectedCategory?.name === categoryName) {
      setSelectedCategory(null);
    }
  };

  const calculateTotalGoalHours = () => {
    return categories.reduce((total, category) => total + category.weeklyHours, 0);
  };

  const calculateRemainingHours = () => {
    const totalGoalHours = calculateTotalGoalHours();
    return Math.max(TOTAL_WEEKLY_HOURS - totalGoalHours, 0);
  };

  const calculateProgress = (categoryName: string) => {
    const selectedHours = calculateCategoryHours(categoryName);
    const category = categories.find(cat => cat.name === categoryName);
    if (category) {
      return Math.min((selectedHours / category.weeklyHours) * 100, 100);
    }
    return 0;
  };

  const handleReorderCategories = (fromIndex: number, toIndex: number) => {
    setCategories(prevCategories => {
      const newCategories = [...prevCategories];
      const [movedCategory] = newCategories.splice(fromIndex, 1);
      newCategories.splice(toIndex, 0, movedCategory);
      return newCategories;
    });
  };

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('cellData', JSON.stringify(cellData));
  }, [cellData]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-96 p-5 border-r border-gray-300 overflow-y-auto">
        <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-5 text-center">
          <h3 className="text-sm font-semibold mb-2">Remaining Unallocated Hours</h3>
          <p className="text-2xl font-bold">{calculateRemainingHours().toFixed(1)} hours</p>
        </div>
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <form onSubmit={handleAddCategory} className="mb-4 space-y-2">
          <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">Category Name:</label>
          <input
            id="category-name"
            ref={categoryInputRef}
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g., Work, Study, Exercise"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <label htmlFor="weekly-hours" className="block text-sm font-medium text-gray-700">Weekly Hours Goal:</label>
          <input
            id="weekly-hours"
            type="number"
            value={newCategoryWeeklyHours}
            onChange={(e) => setNewCategoryWeeklyHours(Number(e.target.value))}
            placeholder="Total hours per week"
            min="0"
            step="0.5"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add Category</button>
        </form>
        <ul className="space-y-2">
          {categories.map((category, index) => {
            const selectedHours = calculateCategoryHours(category.name);
            const progress = calculateProgress(category.name);
            return (
              <li
                key={index}
                className={`p-3 rounded-md cursor-move ${selectedCategory?.name === category.name ? 'ring-2 ring-black' : ''}`}
                style={{ backgroundColor: category.color }}
                onClick={() => setSelectedCategory(category)}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-opacity-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-opacity-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-opacity-50');
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  const toIndex = index;
                  handleReorderCategories(fromIndex, toIndex);
                }}
              >
                <div className="mb-2">
                  <div className='flex justify-between items-center'>
                    <div className='flex'>
                      <input
                        type="color"
                        value={category.color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 border-none p-0 bg-transparent"
                      />
                      <div className="font-semibold">{category.name}</div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        className='bg-transparent border-0 outline-none p-1 hover:bg-white hover:bg-opacity-20 rounded'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCategory(category.name);
                        }}
                      >
                        clear
                      </button>
                      <button
                        className='w-8 h-8 p-1 hover:bg-white hover:bg-opacity-20 rounded'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.name);
                        }}
                      >
                        <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                          <path fill="currentColor" d="M216 48h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a8 8 0 0 0 0 16h8v144a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V64h8a8 8 0 0 0 0-16ZM96 40a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm96 168H64V64h128Zm-80-104v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0Zm48 0v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className='flex gap-4'>
                    <div>goal {category.weeklyHours}hrs</div>
                    <div>filled {selectedHours.toFixed(1)}hrs</div>
                    <div className={`
                      ${(category.weeklyHours - selectedHours) < 0 ? 'text-red-500' :
                        (category.weeklyHours - selectedHours) <= 0.2 * category.weeklyHours ? 'text-yellow-500' : ''}
                    `}>
                      left {(category.weeklyHours - selectedHours).toFixed(1)}hrs
                    </div>
                  </div>
                </div>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-black bg-opacity-20 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          onClick={handleRemoveSelection}
          className={`mt-4 p-2 w-full text-white rounded ${selectedCategory ? 'bg-red-500 hover:bg-red-600 cursor-pointer' : 'bg-gray-400 cursor-default'}`}
          disabled={!selectedCategory}
        >
          Remove Selection
        </button>
        <button
          onClick={handleClearAllCategories}
          className="mt-2 p-2 w-full bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Categories
        </button>
      </div>
      <div className="flex flex-grow overflow-hidden select-none">
        <div className="flex flex-col w-20 flex-shrink-0">
          <div className="h-8"></div>
          {timeSlots.map(time => (
            <div key={time} className="h-8 flex items-center justify-end pr-1 text-xs text-gray-600 border-b border-gray-200">
              {time}
            </div>
          ))}
        </div>
        {days.map(day => (
          <div key={day} className="flex flex-col flex-1 min-w-[100px] border-r border-gray-300">
            <div className="h-8 font-bold text-center py-1 border-b border-gray-300 bg-gray-100 dark:bg-gray-900">{day}</div>
            {timeSlots.map(time => {
              const cellKey = `${day}-${time}`;
              const cellInfo = cellData[cellKey];
              return (
                <div
                  key={`${day}-${time}`}
                  className="h-8 flex items-center justify-center text-xs border-b border-gray-200 overflow-hidden"
                  style={{ backgroundColor: cellInfo ? cellInfo.color : 'white' }}
                  onMouseDown={() => handleMouseDown(day, time)}
                  onMouseEnter={() => handleMouseEnter(day, time)}
                >
                  {cellInfo && cellInfo.category}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
