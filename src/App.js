import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Info, RefreshCw, Settings } from 'lucide-react';

const FibRetracementCalculator = () => {
  const [inputs, setInputs] = useState({
    accountSize: 100,
    riskPercent: 5,
    entryPrice: 158.27,
    stopLoss: 162.51,
    level1Price: 155.84,
    tpPrice: 154.12
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Track which input should maintain focus
  const [focusedField, setFocusedField] = useState(null);
  const inputRefs = useRef({});

  // Maintain focus after re-render
  useEffect(() => {
    if (focusedField && inputRefs.current[focusedField]) {
      inputRefs.current[focusedField].focus();
    }
  }, [inputs, focusedField]);

  // Validation function
  const validateInputs = (inputValues) => {
    const newErrors = {};
    
    if (inputValues.accountSize <= 0) {
      newErrors.accountSize = "Account size must be greater than 0";
    }
    
    if (inputValues.riskPercent <= 0 || inputValues.riskPercent > 100) {
      newErrors.riskPercent = "Risk percent must be between 0.1 and 100";
    }
    
    if (inputValues.entryPrice <= 0) {
      newErrors.entryPrice = "Entry price must be greater than 0";
    }
    
    if (inputValues.stopLoss <= 0) {
      newErrors.stopLoss = "Stop loss must be greater than 0";
    }
    
    if (inputValues.level1Price <= 0) {
      newErrors.level1Price = "Level 1 price must be greater than 0";
    }
    
    if (inputValues.tpPrice <= 0) {
      newErrors.tpPrice = "Take profit price must be greater than 0";
    }
    
    // Logical validations for short positions
    if (inputValues.entryPrice > 0 && inputValues.stopLoss > 0) {
      if (inputValues.stopLoss <= inputValues.entryPrice) {
        newErrors.stopLoss = "For short positions, stop loss must be above entry price";
      }
    }
    
    if (inputValues.entryPrice > 0 && inputValues.tpPrice > 0) {
      if (inputValues.tpPrice >= inputValues.entryPrice) {
        newErrors.tpPrice = "For short positions, take profit must be below entry price";
      }
    }
    
    if (inputValues.entryPrice > 0 && inputValues.level1Price > 0) {
      if (inputValues.level1Price >= inputValues.entryPrice) {
        newErrors.level1Price = "Level 1 price should be below entry price for short positions";
      }
    }

    return newErrors;
  };

  const calculations = useMemo(() => {
    const validationErrors = validateInputs(inputs);
    setErrors(validationErrors);
    
    // If there are validation errors, return empty calculations
    if (Object.keys(validationErrors).length > 0) {
      return {
        hasErrors: true,
        riskDollars: 0,
        entry1Price: 0,
        entry2Price: 0,
        entry3Price: 0,
        weightedEntry: 0,
        distanceToSL: 0,
        totalUnits: 0,
        baseQty: 0,
        entry1Qty: 0,
        entry2Qty: 0,
        entry3Qty: 0,
        entry1Dollars: 0,
        entry2Dollars: 0,
        entry3Dollars: 0,
        totalEntryDollars: 0,
        lossEntry1: 0,
        lossEntry2: 0,
        lossEntry3: 0,
        profitEntry1ToLvl1: 0,
        profitEntry1ToTP: 0,
        profitEntry2ToEntry1: 0,
        profitEntry2ToLvl1: 0,
        profitEntry2ToTP: 0,
        profitEntry3ToEntry2: 0,
        profitEntry3ToEntry1: 0,
        profitEntry3ToLvl1: 0,
        profitEntry3ToTP: 0,
        riskRewards: {}
      };
    }

    const {
      accountSize,
      riskPercent,
      entryPrice,
      stopLoss,
      level1Price,
      tpPrice
    } = inputs;

    try {
      // 1. Risk Dollars
      const riskDollars = accountSize * (riskPercent / 100);

      // 2. Entry Prices (Fixed fibonacci ratios)
      const entry1Price = entryPrice;
      const entry2Price = entryPrice + (stopLoss - entryPrice) * 0.382; // 38.2% retracement
      const entry3Price = entryPrice + (stopLoss - entryPrice) * 0.618; // 61.8% retracement

      // 3. Weighted Average Entry (1:3:5 ratio)
      const weightedEntry = (entry1Price * 1 + entry2Price * 3 + entry3Price * 5) / 9;

      // 4. Distance to Stop Loss
      const distanceToSL = Math.abs(weightedEntry - stopLoss);

      // 5. Total Units (avoid division by zero)
      const totalUnits = distanceToSL > 0 ? riskDollars / distanceToSL : 0;

      // 6. Base Quantity
      const baseQty = totalUnits / 9;

      // 7. Quantity per Entry
      const entry1Qty = baseQty * 1;
      const entry2Qty = baseQty * 3;
      const entry3Qty = baseQty * 5;

      // 8. Dollar Amount Invested at Each Entry
      const entry1Dollars = entry1Qty * entry1Price;
      const entry2Dollars = entry2Qty * entry2Price;
      const entry3Dollars = entry3Qty * entry3Price;
      const totalEntryDollars = entry1Dollars + entry2Dollars + entry3Dollars;

      // Loss from Each Entry Level
      const lossEntry1 = -Math.abs((stopLoss * entry1Qty) - (entry1Price * entry1Qty));
      const lossEntry2 = -Math.abs((stopLoss * (entry1Qty + entry2Qty)) - ((entry1Price * entry1Qty) + (entry2Price * entry2Qty)));
      const lossEntry3 = -Math.abs((stopLoss * totalUnits) - ((entry1Price * entry1Qty) + (entry2Price * entry2Qty) + (entry3Price * entry3Qty)));

      // Profit Calculations
      const profitEntry1ToLvl1 = Math.abs((entry1Price - level1Price) * entry1Qty);
      const profitEntry1ToTP = Math.abs((entry1Price - tpPrice) * entry1Qty);
      const profitEntry2ToEntry1 = Math.abs((entry1Price * entry2Qty) - (entry2Price * entry2Qty));
      const profitEntry2ToLvl1 = Math.abs((entry1Price - level1Price) * entry1Qty) + Math.abs((entry2Price - level1Price) * entry2Qty);
      const profitEntry2ToTP = Math.abs((entry1Price - tpPrice) * entry1Qty) + Math.abs((entry2Price - tpPrice) * entry2Qty);
      const profitEntry3ToEntry2 = Math.abs((entry2Price * entry3Qty) - (entry3Price * entry3Qty));
      const profitEntry3ToEntry1 = Math.abs((entry1Price * entry3Qty) - (entry3Price * entry3Qty));
      const profitEntry3ToLvl1 = Math.abs((weightedEntry - level1Price) * totalUnits);
      const profitEntry3ToTP = Math.abs((weightedEntry - tpPrice) * totalUnits);

      // Risk/Reward Ratios (with error handling for division by zero)
      const maxLoss = Math.abs(lossEntry3);
      const riskRewards = maxLoss > 0 ? {
        'Entry 1 → Level 1': profitEntry1ToLvl1 / maxLoss,
        'Entry 1 → Take Profit': profitEntry1ToTP / maxLoss,
        'Entry 2 → Entry 1': profitEntry2ToEntry1 / maxLoss,
        'Entry 2 → Level 1': profitEntry2ToLvl1 / maxLoss,
        'Entry 2 → Take Profit': profitEntry2ToTP / maxLoss,
        'Entry 3 → Entry 2': profitEntry3ToEntry2 / maxLoss,
        'Entry 3 → Entry 1': profitEntry3ToEntry1 / maxLoss,
        'Entry 3 → Level 1': profitEntry3ToLvl1 / maxLoss,
        'Entry 3 → Take Profit': profitEntry3ToTP / maxLoss
      } : {};

      return {
        hasErrors: false,
        riskDollars,
        entry1Price,
        entry2Price,
        entry3Price,
        weightedEntry,
        distanceToSL,
        totalUnits,
        baseQty,
        entry1Qty,
        entry2Qty,
        entry3Qty,
        entry1Dollars,
        entry2Dollars,
        entry3Dollars,
        totalEntryDollars,
        lossEntry1,
        lossEntry2,
        lossEntry3,
        profitEntry1ToLvl1,
        profitEntry1ToTP,
        profitEntry2ToEntry1,
        profitEntry2ToLvl1,
        profitEntry2ToTP,
        profitEntry3ToEntry2,
        profitEntry3ToEntry1,
        profitEntry3ToLvl1,
        profitEntry3ToTP,
        riskRewards
      };
    } catch (error) {
      console.error('Calculation error:', error);
      return { hasErrors: true };
    }
  }, [inputs]);

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value);
    setInputs(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const resetToDefaults = () => {
    setInputs({
      accountSize: 10000,
      riskPercent: 2,
      entryPrice: 158.27,
      stopLoss: 162.51,
      level1Price: 155.84,
      tpPrice: 154.12
    });
    setErrors({});
    setFocusedField(null);
  };

  const formatCurrency = (value) => {
    if (isNaN(value) || !isFinite(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value, decimals = 4) => {
    if (isNaN(value) || !isFinite(value)) return '0.00';
    return Number(value).toFixed(decimals);
  };

  const InputField = ({ label, field, step = "0.01", type = "number", tooltip }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {tooltip && (
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <input
        ref={(el) => {
          if (el) inputRefs.current[field] = el;
        }}
        type={type}
        step={step}
        value={inputs[field]}
        onFocus={() => setFocusedField(field)}
        onBlur={() => setFocusedField(null)}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
          errors[field] 
            ? 'border-red-300 focus:ring-red-500 bg-red-50' 
            : 'border-gray-300 focus:ring-blue-500'
        }`}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
      {errors[field] && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Fibonacci Retracement Position Size Calculator
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </button>
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <InputField 
            label="Account Size ($)" 
            field="accountSize" 
            step="100"
            tooltip="Total trading account balance"
          />
          <InputField 
            label="Risk Percent (%)" 
            field="riskPercent" 
            step="0.1"
            tooltip="Percentage of account to risk on this trade (recommended: 1-3%)"
          />
          <InputField 
            label="Entry Price ($)" 
            field="entryPrice"
            tooltip="Initial entry price for the trade"
          />
          <InputField 
            label="Stop Loss ($)" 
            field="stopLoss"
            tooltip="Price level where you'll exit if trade goes against you"
          />
          <InputField 
            label="Level 1 Price ($)" 
            field="level1Price"
            tooltip="First partial profit target"
          />
          <InputField 
            label="Take Profit ($)" 
            field="tpPrice"
            tooltip="Final profit target for the trade"
          />
        </div>

        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Please fix the following errors:</h3>
            </div>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {Object.values(errors).map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Results Grid */}
        {!calculations.hasErrors && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Risk & Entry Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Risk & Entry Details</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Risk Dollars:</span>
                  <span className="font-semibold text-red-600 text-lg">{formatCurrency(calculations.riskDollars)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weighted Entry Price:</span>
                  <span className="font-semibold">${formatNumber(calculations.weightedEntry, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance to Stop Loss:</span>
                  <span className="font-semibold">${formatNumber(calculations.distanceToSL, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Units:</span>
                  <span className="font-semibold">{formatNumber(calculations.totalUnits, 2)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-gray-600 font-medium">Total Investment:</span>
                  <span className="font-bold text-blue-600 text-lg">{formatCurrency(calculations.totalEntryDollars)}</span>
                </div>
              </div>
            </div>

            {/* Entry Levels */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Entry Levels</h2>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 bg-white rounded-r-lg p-3">
                  <div className="text-sm text-gray-600 font-medium">Entry 1 (Initial Entry)</div>
                  <div className="font-bold text-lg">${formatNumber(calculations.entry1Price, 2)}</div>
                  <div className="text-sm text-gray-500">
                    Qty: {formatNumber(calculations.entry1Qty, 2)} • {formatCurrency(calculations.entry1Dollars)}
                  </div>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4 bg-white rounded-r-lg p-3">
                  <div className="text-sm text-gray-600 font-medium">Entry 2 (38.2% Retracement)</div>
                  <div className="font-bold text-lg">${formatNumber(calculations.entry2Price, 2)}</div>
                  <div className="text-sm text-gray-500">
                    Qty: {formatNumber(calculations.entry2Qty, 2)} • {formatCurrency(calculations.entry2Dollars)}
                  </div>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4 bg-white rounded-r-lg p-3">
                  <div className="text-sm text-gray-600 font-medium">Entry 3 (61.8% Retracement)</div>
                  <div className="font-bold text-lg">${formatNumber(calculations.entry3Price, 2)}</div>
                  <div className="text-sm text-gray-500">
                    Qty: {formatNumber(calculations.entry3Qty, 2)} • {formatCurrency(calculations.entry3Dollars)}
                  </div>
                </div>
              </div>
            </div>

            {/* Loss Scenarios */}
            <div className="bg-red-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-800">Loss Scenarios</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-gray-600">If only Entry 1 fills:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(Math.abs(calculations.lossEntry1))}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-gray-600">If Entry 1 & 2 fill:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(Math.abs(calculations.lossEntry2))}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded border-2 border-red-200">
                  <span className="text-gray-600 font-medium">Max Loss (all entries):</span>
                  <span className="font-bold text-red-600 text-lg">{formatCurrency(Math.abs(calculations.lossEntry3))}</span>
                </div>
              </div>
            </div>

            {/* Profit Scenarios */}
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Profit Scenarios</h2>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-gray-600">Entry 1 → Level 1:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(calculations.profitEntry1ToLvl1)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-gray-600">Entry 1 → Take Profit:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(calculations.profitEntry1ToTP)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-gray-600">Entry 2 → Entry 1:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(calculations.profitEntry2ToEntry1)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="text-gray-600">Entry 2 → Take Profit:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(calculations.profitEntry2ToTP)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded border-2 border-green-200">
                  <span className="text-gray-600 font-medium">Entry 3 → Take Profit:</span>
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(calculations.profitEntry3ToTP)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk/Reward Ratios */}
        {!calculations.hasErrors && Object.keys(calculations.riskRewards).length > 0 && (
          <div className="mt-6 bg-indigo-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Risk/Reward Ratios</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(calculations.riskRewards).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">{key}</div>
                  <div className={`font-bold text-xl ${
                    value >= 1 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {formatNumber(value, 2)}:1
                  </div>
                  
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trading Notes */}
        {showAdvanced && !calculations.hasErrors && (
          <div className="mt-6 bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-yellow-600" />
              <h2 className="text-xl font-semibold text-gray-800">Trading Notes</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Position Sizing Strategy:</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Entry 1: {((calculations.entry1Qty / calculations.totalUnits) * 100).toFixed(1)}% of total position</li>
                  <li>• Entry 2: {((calculations.entry2Qty / calculations.totalUnits) * 100).toFixed(1)}% of total position</li>
                  <li>• Entry 3: {((calculations.entry3Qty / calculations.totalUnits) * 100).toFixed(1)}% of total position</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Risk Management:</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Total capital at risk: {((calculations.riskDollars / inputs.accountSize) * 100).toFixed(1)}%</li>
                  <li>• Capital deployment: {((calculations.totalEntryDollars / inputs.accountSize) * 100).toFixed(1)}%</li>
                  <li>• Leverage ratio: {(calculations.totalEntryDollars / calculations.riskDollars).toFixed(2)}:1</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FibRetracementCalculator;