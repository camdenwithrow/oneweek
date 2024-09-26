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

  const formatTime = (hour: number): string => {
    if (hour === 24) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(formatTime(hour));
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
      setCellData(prevData => ({
        ...prevData,
        [cellKey]: { category: selectedCategory.name, color: selectedCategory.color }
      }));
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
    <div className="app">
      <div className="left-panel">
        <div className="total-hours">
          <h3>Remaining Unallocated Hours</h3>
          <p>{calculateRemainingHours().toFixed(1)} hours</p>
        </div>
        <h2>Categories</h2>
        <form onSubmit={handleAddCategory}>
          <label htmlFor="category-name">Category Name:</label>
          <input
            id="category-name"
            ref={categoryInputRef}
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g., Work, Study, Exercise"
          />

          <label htmlFor="weekly-hours">Weekly Hours Goal:</label>
          <input
            id="weekly-hours"
            type="number"
            value={newCategoryWeeklyHours}
            onChange={(e) => setNewCategoryWeeklyHours(Number(e.target.value))}
            placeholder="Total hours per week"
            min="0"
            step="0.5"
          />

          <button type="submit">Add Category</button>
        </form>
        <ul className="category-list">
          {categories.map((category, index) => {
            const selectedHours = calculateCategoryHours(category.name);
            const difference = category.weeklyHours - selectedHours;
            return (
              <li
                key={index}
                style={{
                  backgroundColor: category.color,
                  padding: '5px',
                  marginBottom: '5px',
                  cursor: 'pointer',
                  border: selectedCategory?.name === category.name ? '2px solid black' : 'none'
                }}
                onClick={() => setSelectedCategory(category)}
              >
                <div>{category.name}</div>
                <div className='category-info'>
                  <div>Goal:{category.weeklyHours} hours</div>
                  <div>Selected: {selectedHours.toFixed(1)} hours</div>
                  <div>Difference: {difference.toFixed(1)} hours</div>
                </div>
                <div className="category-actions">
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearCategory(category.name);
                    }}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.name);
                    }}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          onClick={handleRemoveSelection}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: selectedCategory ? '#f44336' : '#ccc',
            color: 'white',
            border: 'none',
            cursor: selectedCategory ? 'pointer' : 'default'
          }}
          disabled={!selectedCategory}
        >
          Remove Selection
        </button>
        <button
          onClick={handleClearAllCategories}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Clear All Categories
        </button>
      </div>
      <div className="week-view">
        <div className="time-column">
          <div className="day-header"></div>
          {timeSlots.map(time => (
            <div key={time} className="time-slot">
              {time}
            </div>
          ))}
        </div>
        {days.map(day => (
          <div key={day} className="day-column">
            <div className="day-header">{day}</div>
            {timeSlots.map(time => {
              const cellKey = `${day}-${time}`;
              const cellInfo = cellData[cellKey];
              return (
                <div 
                  key={`${day}-${time}`} 
                  className="cell"
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
