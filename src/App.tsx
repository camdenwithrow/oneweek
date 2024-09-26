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
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
};

const App = () => {
  const [categories, setCategories] = useState<Category[]>(() => {
    const storedCategories = localStorage.getItem('categories');
    return storedCategories ? JSON.parse(storedCategories) : [];
  });
  const [newCategory, setNewCategory] = useState<string>('');
  const [newCategoryHours, setNewCategoryHours] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [cellData, setCellData] = useState<{[key: string]: CellData}>(() => {
    const storedCellData = localStorage.getItem('cellData');
    return storedCellData ? JSON.parse(storedCellData) : {};
  });
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startHour = 6;
  const endHour = 24;

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('cellData', JSON.stringify(cellData));
  }, [cellData]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory && newCategoryHours > 0) {
      const newCategoryObj = { 
        name: newCategory, 
        weeklyHours: newCategoryHours, 
        color: generateRandomColor() 
      };
      setCategories(prevCategories => [...prevCategories, newCategoryObj]);
      setNewCategory('');
      setNewCategoryHours(0);
      categoryInputRef.current?.focus();
    }
  };

  const handleColorChange = (index: number, newColor: string) => {
    setCategories(prevCategories => 
      prevCategories.map((category, i) => 
        i === index ? { ...category, color: newColor } : category
      )
    );
  };

  const handleCellClick = (day: string, time: string) => {
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

  const handleRemoveSelection = () => {
    setSelectedCategory(null);
  };

  const calculateCategoryHours = (categoryName: string) => {
    const categorySlots = Object.values(cellData).filter(cell => cell.category === categoryName);
    return categorySlots.length * 0.5; // Each slot is 30 minutes, so multiply by 0.5 to get hours
  };

  return (
    <div className="app">
      <div className="left-panel">
        <h2>Categories</h2>
        <form onSubmit={handleAddCategory}>
          <input
            ref={categoryInputRef}
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name"
          />
          <input
            type="number"
            value={newCategoryHours}
            onChange={(e) => setNewCategoryHours(Number(e.target.value))}
            placeholder="Weekly hours"
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
                <div>{category.name}: {category.weeklyHours} hours/week</div>
                <div>Selected: {selectedHours.toFixed(1)} hours</div>
                <div>Difference: {difference.toFixed(1)} hours</div>
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  style={{ marginLeft: '10px' }}
                  onClick={(e) => e.stopPropagation()}
                />
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
                  onClick={() => handleCellClick(day, time)}
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