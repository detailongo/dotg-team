'use client';
import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';

/* ------------------- Stripe Setup ------------------- */
const stripePromise = loadStripe(
  // 'pk_live_51NyDg2B0J8erMOcfC4Zhpkwn04pi7RQvf2thhRsqGRgKc5kdC40TdV2UES2u0zPkxOxRz3AUxbDdL8bZCDu7ZB2d00HJX4UV2X'
  'pk_test_51NyDg2B0J8erMOcfH548HQOHIyYBtw5zyLakwE9Wgb7flWV8Eq3wJdK7q5gPX7leqU3iXQI1ymHNoLah4uNN7tGK00QtLJ2PaO'

);

// UPDATED ENDPOINTS
const paymentEndpoint = 'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/stripe';
const calculateTaxEndpoint = 'https://us-central1-lilautomate2.cloudfunctions.net/calculateTax';

/* ------ Pricing & Mappings ----- */
const sizeMappings = {
  Sedan: 1,
  'Small/Mid-SUV': 1.13,
  'Large-SUV': 1.2,
  'Small/Mid-Truck': 1.1,
  'Large-Truck': 1.15,
  'Transit-Van-1': 1.1,
  'Transit-Van-2': 1.8,
};


const basePrice = {
  interior: 219,
  exterior: 99,
  both: 260,
};

const addOnPrices = {
  ceramic: 50,
  paint: 100,
  petHair: 75,
};

/* ---------------- BOOKING FORM ---------------- */
function BookingForm() {
  const [detailerInfo, setDetailerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  const totalSteps = 7;
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Slide 1
    phone: '',
    address: '',
    latitude: null,
    longitude: null,


    // Slide 2
    vehicleSize: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    condition: '',
    package: '',
    addons: [],
    calculatedPrice: 0,

    // Slide 4
    date: '',
    time: '',
    frequency: '',

    // Slide 5
    firstName: '',
    lastName: '',
    email: '',
    utilities: '',
    garage: '',
    notes: '',

    // Slide 6 Payment
    nameOnCard: '',
    cardPhone: '',
    cardEmail: '',
    stripeCustomerID: '',
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);


  // For displaying calculated tax details
  const [taxInfo, setTaxInfo] = useState({
    totalBeforeTax: '0.00',
    taxRate: '0',
    totalTax: '0.00',
    totalAfterTax: '0.00',
  });

  // Scheduling states (Slide 4)
  const [branch] = useState('lwr');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  /* -------------- Lifecycle -------------- */
  useEffect(() => {
    if (currentStep === 1) initializeAutocomplete();
  }, []);

  useEffect(() => {
    if (currentStep === 2) populateVehicleDropdowns();
    if (currentStep === 4) fetchAvailability(branch);
  }, [currentStep, branch]);

  // Whenever we land on step 5, calculate the tax
  useEffect(() => {
    if (currentStep === 5) {
      handleCalculateTax();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  /* -------------- Price Calculation -------------- */
  function updatePrice(pkg = formData.package, addons = formData.addons) {
    if (!formData.vehicleSize || !pkg) {
      setFormData((prev) => ({ ...prev, calculatedPrice: 0 }));
      return;
    }
    const sizeMultiplier = sizeMappings[formData.vehicleSize] || 1;
    let price = Math.round(basePrice[pkg] * sizeMultiplier);

    let addOnsTotal = 0;
    addons.forEach((a) => {
      addOnsTotal += addOnPrices[a] || 0;
    });
    price += addOnsTotal;

    setFormData((prev) => ({
      ...prev,
      package: pkg,
      addons,
      calculatedPrice: price,
    }));
  }

  function getPackagePrice(pkg) {
    const multi = sizeMappings[formData.vehicleSize] || 1;
    return Math.round(basePrice[pkg] * multi);
  }

  /* -------------- Tax Calculation -------------- */
  async function handleCalculateTax() {
    // If no total or no address, skip
    if (!formData.calculatedPrice || !formData.address) {
      setTaxInfo({
        totalBeforeTax: formData.calculatedPrice.toFixed(2),
        taxRate: '(to be calculated)',
        totalTax: '(to be calculated)',
        totalAfterTax: formData.calculatedPrice.toFixed(2), // Use calculatedPrice as fallback
      });
      return;
    }

    try {
      const response = await fetch(calculateTaxEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressStreet: formData.street_number + ' ' + formData.route,
          addressCity: formData.locality,
          addressState: formData.state,
          addressPostal: formData.postal_code,
          addressCountry: 'US',
          amount: formData.calculatedPrice,
        }),
      });

      if (!response.ok) {
        console.error(`HTTP error ${response.status}`);
        setTaxInfo({
          totalBeforeTax: formData.calculatedPrice.toFixed(2),
          taxRate: '(to be calculated)',
          totalTax: '(to be calculated)',
          totalAfterTax: formData.calculatedPrice.toFixed(2), // Use calculatedPrice as fallback
        });
        return;
      }

      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        setTaxInfo({
          totalBeforeTax: formData.calculatedPrice.toFixed(2),
          taxRate: '(to be calculated)',
          totalTax: '(to be calculated)',
          totalAfterTax: formData.calculatedPrice.toFixed(2), // Use calculatedPrice as fallback
        });
        return;
      }

      // Set tax info from API response
      setTaxInfo({
        totalBeforeTax: data.totalBeforeTax,
        taxRate: data.taxRate,
        totalTax: data.totalTax,
        totalAfterTax: data.totalAfterTax,
      });
    } catch (error) {
      console.error('Error calculating tax:', error);
      setTaxInfo({
        totalBeforeTax: formData.calculatedPrice.toFixed(2),
        taxRate: '(to be calculated)',
        totalTax: '(to be calculated)',
        totalAfterTax: formData.calculatedPrice.toFixed(2), // Use calculatedPrice as fallback
      });
    }
  }



  /* -------------- Step Navigation -------------- */
  async function handleNext() {
    // On Step 4, require a slot
    if (currentStep === 4 && !selectedSlot) {
      alert('Please select a date/time slot before continuing.');
      return;
    }
    // On Step 6 => "Skip"
    if (currentStep === 6) {
      const confirmSkip = window.confirm(
        'Are you sure you want to skip payment? You can pay on the day of service.'
      );
      if (!confirmSkip) {
        return;
      } else {
        // If skipping => send data to Cloud, then go to step 7
        await postFormDataToCloud();
      }
    }
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  }

  /* -------------- POST Data to Cloud on Slide 7 -------------- */
  async function postFormDataToCloud() {
    try {
      const response = await fetch(
        'https://us-central1-detail-on-the-go-universal.cloudfunctions.net/book',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) {
        console.error('Error sending data to cloud:', response.status);
      } else {
        console.log('Data sent successfully to cloud function');
      }
    } catch (error) {
      console.error('Network error sending data:', error);
    }
  }

  /* -------------- Input Handlers -------------- */
  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      let newAddons = [...formData.addons];
      if (checked) newAddons.push(value);
      else newAddons = newAddons.filter((a) => a !== value);
      updatePrice(formData.package, newAddons);
      setFormData((prev) => ({ ...prev, addons: newAddons }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handlePackageChange(e) {
    const pkg = e.target.value;
    setFormData((prev) => ({ ...prev, package: pkg }));
    updatePrice(pkg, formData.addons);
  }

  // Step 3 => yes => step 2, no => step 4
  function handlePetHairChoice(e) {
    if (e.target.value === 'yes') setCurrentStep(2);
    else setCurrentStep(4);
  }

  /* -------------- Map Initialization -------------- */
  useEffect(() => {
    if (mapRef.current && !mapInstance.current && window.google) {
      // Set an initial position (e.g., center of the U.S.)
      const initialPosition = { lat: 39.8283, lng: -98.5795 };
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: initialPosition,
        zoom: 4,
        disableDefaultUI: true,
        styles: [ 
          // Minimal style options for a clean look
          {
            featureType: 'all',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f2f2f2' }],
          },
        ],
      });
      // Create a marker (the location pin)
      markerInstance.current = new google.maps.Marker({
        position: initialPosition,
        map: mapInstance.current,
      });
    }
  }, [mapRef]);
  


  /* -------------- Update Map when Coordinates Change -------------- */
  useEffect(() => {
    if (mapInstance.current && formData.latitude && formData.longitude) {
      const newPosition = {
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude),
      };
      // Center the map on the new position
      mapInstance.current.setCenter(newPosition);
      mapInstance.current.setZoom(15); // Or any zoom level you prefer
      // Move the marker to the new position
      markerInstance.current.setPosition(newPosition);
    }
  }, [formData.latitude, formData.longitude]);

  /* -------------- Slide 1: Google Autocomplete -------------- */
  function initializeAutocomplete() {
    const addressInput = document.getElementById('address');
    if (!addressInput) {
      console.error('Address input field not found.');
      return;
    }
  
    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
      componentRestrictions: { country: ['us'] },
      fields: ['address_components', 'geometry'],
      types: ['address'],
    });
  
    autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace();
      console.log('Selected Place:', place);
  
      if (!place.geometry) {
        alert('No address details available.');
        return;
      }
  
      // Get the complete address from the input element
      const userAddress = addressInput.value;
      // Update formData with the address as well as coordinates from the selected place
      setFormData((prev) => ({
        ...prev,
        address: userAddress,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      }));

      // (Optional) You can still call your backend to get the closest branch:
      const closestBranch = await getClosestBranch(userAddress);
      if (closestBranch) {
        console.log('Matched Branch Data:', closestBranch);
      } else {
        console.log('No branch matched for this location.');
      }
    });
  }
  
  
  /**
   * Use the backend to find the nearest branch.
   * @param {string} userAddress - The user's input address.
   * @returns {Promise<object|null>} - The closest branch details or null if no branch is found.
   */
  async function getClosestBranch(userAddress) {
    try {
      const response = await fetch(
        `https://us-central1-detail-on-the-go-universal.cloudfunctions.net/branch-match?address=${encodeURIComponent(userAddress)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!response.ok) {
        console.error('Error fetching closest branch:', response.statusText);
        return null;
      }
  
      const data = await response.json();
      if (data.closestBranch) {
        // Set detailer information
        console.log(data.closestBranch)
        setDetailerInfo({
          name: data.closestBranch.employeeName || 'N/A',
          email: data.closestBranch.employeeEmail || 'N/A',
          phone: data.closestBranch.businessNumber || 'N/A',
        });
        return data;
      } else {
        console.error('No branch found in response:', data);
        return null;
      }
    } catch (error) {
      console.error('Error calling backend:', error);
      return null;
    }
  }
  
  


  /* -------------- Slide 2: Populate Y/M/M -------------- */
  async function populateVehicleDropdowns() {
    const yearSelect = document.getElementById('vehicleYear');
    const makeSelect = document.getElementById('vehicleMake');
    const modelSelect = document.getElementById('vehicleModel');

    if (yearSelect.options.length <= 1) {
      const cYear = new Date().getFullYear();
      for (let y = cYear; y >= 1995; y--) {
        yearSelect.add(new Option(y.toString(), y.toString()));
      }
    }

    if (formData.vehicleYear) {
      yearSelect.value = formData.vehicleYear;
    }
    if (formData.vehicleMake) {
      makeSelect.innerHTML = `<option value="${formData.vehicleMake}">${formData.vehicleMake}</option>`;
    }
    if (formData.vehicleModel) {
      modelSelect.innerHTML = `<option value="${formData.vehicleModel}">${formData.vehicleModel}</option>`;
    }

    yearSelect.addEventListener('change', async (e) => {
      setFormData((prev) => ({ ...prev, vehicleYear: e.target.value }));
      try {
        makeSelect.innerHTML = '<option value="">Loading makes...</option>';
        const r = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json&modelYear=${e.target.value}`
        );
        const data = await r.json();
        makeSelect.innerHTML = '<option value="">Select Make</option>';
        data.Results.forEach((mk) => {
          if (mk.MakeName) {
            makeSelect.add(new Option(mk.MakeName, mk.MakeName));
          }
        });
      } catch {
        makeSelect.innerHTML = '<option value="">Error loading makes</option>';
      }
    });

    makeSelect.addEventListener('change', async (e) => {
      setFormData((prev) => ({ ...prev, vehicleMake: e.target.value }));
      try {
        modelSelect.innerHTML = '<option value="">Loading models...</option>';
        const rr = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${e.target.value}/modelyear/${yearSelect.value}?format=json`
        );
        const data = await rr.json();
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        data.Results.forEach((m) => {
          if (m.Model_Name) {
            modelSelect.add(new Option(m.Model_Name, m.Model_Name));
          }
        });
      } catch {
        modelSelect.innerHTML = '<option value="">Error loading models</option>';
      }
    });

    modelSelect.addEventListener('change', async (e) => {
      setFormData((prev) => ({ ...prev, vehicleModel: e.target.value }));
    });
  }

  /* -------------- Slide 4: Scheduling/Calendar -------------- */
  async function fetchAvailability(branchName) {
    try {
      const apiUrl = `https://us-central1-dotg-d6313.cloudfunctions.net/website-availability?branch=${branchName}`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setAvailableSlots(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  }

  function formatDateYMD(d) {
    return d.toISOString().slice(0, 10);
  }

  function getMonthDetails(dateObj) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = last.getDate();
    const startWeekday = first.getDay();
    return { first, last, days, startWeekday };
  }

  function canGoPrevMonth() {
    const copy = new Date();
    copy.setHours(0, 0, 0, 0);
    const startOfThisMonth = new Date(copy.getFullYear(), copy.getMonth(), 1);
    return currentMonth > startOfThisMonth;
  }

  function canGoNextMonth() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const limit = new Date(now);
    limit.setDate(now.getDate() + 90);
    const copy = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    return copy <= limit;
  }

  function handleMonthChange(delta) {
    if (delta < 0 && !canGoPrevMonth()) return;
    if (delta > 0 && !canGoNextMonth()) return;
    setSelectedDate(null);
    setSelectedSlot('');
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  }

  function getSlotsForDate(dateStr) {
    return availableSlots.filter((s) => s.includes(dateStr));
  }

  function handleDayClick(dateStr) {
    setSelectedDate(dateStr);
    setSelectedSlot('');
  }

  function handleSlotClick(isoString) {
    setSelectedSlot(isoString);
    const dt = new Date(isoString);
    const dateOnly = dt.toISOString().slice(0, 10);
    const timeOnly = dt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    setFormData((prev) => ({ ...prev, date: dateOnly, time: timeOnly }));
  }

  function renderCalendar() {
    const { days, startWeekday } = getMonthDetails(currentMonth);
    const squares = [];

    // Day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d, i) => {
      squares.push(
        <div key={`hdr-${i}`} className="font-bold text-center">
          {d}
        </div>
      );
    });

    for (let i = 0; i < startWeekday; i++) {
      squares.push(<div key={`emp-${i}`} />);
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const maxDate = new Date(now);
    maxDate.setDate(now.getDate() + 90);

    for (let day = 1; day <= days; day++) {
      const dayDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const dateStr = formatDateYMD(dayDate);
      const daySlots = getSlotsForDate(dateStr);

      const isPast = dayDate < now;
      const isFuture = dayDate > maxDate;
      let className =
        'border p-2 text-center cursor-pointer hover:translate-y-[2px] hover:shadow-none';

      if (selectedDate === dateStr) {
        className += ' bg-green-500 text-white';
      } else if (daySlots.length) {
        className += ' bg-blue-500 text-white hover:bg-blue-600';
      } else {
        className += ' text-gray-400';
      }

      if (isPast || isFuture) {
        squares.push(
          <div
            key={`day-${day}`}
            className="border p-2 text-center text-gray-400"
          >
            {day}
          </div>
        );
      } else if (!daySlots.length) {
        squares.push(
          <div
            key={`day-${day}`}
            className="border p-2 text-center text-gray-400"
          >
            {day}
          </div>
        );
      } else {
        squares.push(
          <div
            key={`day-${day}`}
            className={`${className}`}
            onClick={() => handleDayClick(dateStr)}
          >
            {day}
          </div>
        );
      }
    }

    return (
      <div>
        <div className="flex justify-between mb-2">
          <button
            onClick={() => handleMonthChange(-1)}
            disabled={!canGoPrevMonth()}
            className="px-2 py-1 bg-gray-300 rounded hover:translate-y-[2px] active:translate-y-[6px]"
          >
            Prev
          </button>
          <div className="font-bold">
            {currentMonth.toLocaleString('default', { month: 'long' })}{' '}
            {currentMonth.getFullYear()}
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            disabled={!canGoNextMonth()}
            className="px-2 py-1 bg-gray-300 rounded hover:translate-y-[2px] active:translate-y-[6px]"
          >
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">{squares}</div>
      </div>
    );
  }

  function renderSlots() {
    if (!selectedDate) return <p className="mt-4">No date selected.</p>;
    const daySlots = getSlotsForDate(selectedDate);
    if (!daySlots.length)
      return <p className="mt-4">No available slots for {selectedDate}.</p>;
    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">Available times for {selectedDate}:</h3>
        {daySlots.map((slotIso) => {
          const isSelected = slotIso === selectedSlot;
          const time = new Date(slotIso).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          return (
            <button
              key={slotIso}
              onClick={() => handleSlotClick(slotIso)}
              className={`
                block w-full text-left px-4 py-2 border rounded mb-2 
                hover:translate-y-[2px] active:translate-y-[6px]
                ${isSelected ? 'bg-green-500 text-white' : 'bg-white'}
              `}
            >
              {time}
            </button>
          );
        })}
      </div>
    );
  }

  /* -------- Slide 7: Booking Complete + Book Another -------- */
  function handleBookAnother() {
    setFormData((prev) => ({
      ...prev,
      vehicleSize: '',
      vehicleYear: '',
      vehicleMake: '',
      vehicleModel: '',
      condition: '',
      package: '',
      addons: [],
      date: '',
      time: '',
      frequency: '',
    }));
    setSelectedDate(null);
    setSelectedSlot('');
    setCurrentMonth(new Date());
    setCurrentStep(1);
  }

  /* ------ RENDER ------ */
  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
      {/* Green progress bar at the top */}
      <div className="text-center">
  <div className="mb-4">
      <h1 className="text-2xl font-bold text-center">Detail On The Go Booking Form</h1>
      {detailerInfo.name && (
        <div className="text-center mt-4">
          <p className="text-lg font-semibold">Detailer: {detailerInfo.name}</p>
          <p>
            Email: <a href={`mailto:${detailerInfo.email}`} className="text-blue-500">{detailerInfo.email}</a>
          </p>
          <p>
            Phone: <a href={`tel:${detailerInfo.phone}`} className="text-blue-500">{detailerInfo.phone}</a>
          </p>
        </div>
      )}
    </div>
</div>
<div className="w-full bg-gray-200 h-4 rounded-full mb-4 overflow-hidden">
  <div
    className="bg-green-500 h-4 rounded-full"
    style={{
      width: `${(currentStep / totalSteps) * 100}%`,
      transition: 'width 0.5s ease-in-out',
    }}
  ></div>
</div>

      <h2 className="text-xl font-bold text-center mb-4">
        Step {currentStep} of {totalSteps}
      </h2>

      {/* Slide 1 */}
      {currentStep === 1 && (
  <div>
    <label className="block mb-2 text-sm font-medium text-gray-700">
      Phone Number
    </label>
    <input
      type="tel"
      name="phone"
      value={formData.phone}
      onChange={handleInputChange}
      placeholder="Enter your phone number"
      className="w-full border border-gray-300 rounded-md p-2 mb-4"
    />

    <label className="block mb-2 text-sm font-medium text-gray-700">
      Address
    </label>
    <input
      type="text"
      id="address"
      name="address"
      value={formData.address}
      onChange={handleInputChange}
      placeholder="Start typing your address"
      className="w-full border border-gray-300 rounded-md p-2"
    />

    {/* Container for map + fade overlay */}
    <div className="relative" style={{ marginTop: '8px' }}>
      <div
        id="map"
        ref={mapRef}
        style={{ width: '100%', height: '300px' }}
      />
      {/* Gradient fade from white to transparent */}
      <div
        className="absolute top-0 left-0 w-full h-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, #ffffff, rgba(255,255,255,0))',
        }}
      />
    </div>
  </div>
)}


      {/* Slide 2 */}
      {currentStep === 2 && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Select Vehicle Size
          </label>
          <select
            name="vehicleSize"
            value={formData.vehicleSize}
            onChange={(e) => {
              handleInputChange(e);
              if (formData.package) {
                updatePrice(formData.package, formData.addons);
              }
            }}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          >
            <option value="">Select Vehicle Size</option>
            {Object.keys(sizeMappings).map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Select Year
          </label>
          <select
            id="vehicleYear"
            className="w-full border border-gray-300 rounded-md p-2"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, vehicleYear: e.target.value }))
            }
            value={formData.vehicleYear}
          >
            <option value="">Select Year</option>
          </select>

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Select Make
          </label>
          <select
            id="vehicleMake"
            className="w-full border border-gray-300 rounded-md p-2"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, vehicleMake: e.target.value }))
            }
            value={formData.vehicleMake}
          >
            <option value="">Select Make</option>
          </select>

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Select Model
          </label>
          <select
            id="vehicleModel"
            className="w-full border border-gray-300 rounded-md p-2"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, vehicleModel: e.target.value }))
            }
            value={formData.vehicleModel}
          >
            <option value="">Select Model</option>
          </select>

          <label className="block mt-4 mb-2 text-sm font-medium text-gray-700">
            Interior Condition
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Select Condition</option>
            <option value="clean">Clean</option>
            <option value="moderate">Moderate</option>
            <option value="heavy">Heavy</option>
          </select>

          <p className="mt-6 mb-2 text-sm font-medium text-gray-700">
            Select Package
          </p>
          <div className="flex items-center mb-2">
            <input
              type="radio"
              name="package"
              id="interior"
              value="interior"
              checked={formData.package === 'interior'}
              onChange={handlePackageChange}
            />
            <label htmlFor="interior" className="ml-2">
              Interior (${getPackagePrice('interior')})
            </label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="radio"
              name="package"
              id="exterior"
              value="exterior"
              checked={formData.package === 'exterior'}
              onChange={handlePackageChange}
            />
            <label htmlFor="exterior" className="ml-2">
              Exterior (${getPackagePrice('exterior')})
            </label>
          </div>
          <div className="flex items-center mb-4">
            <input
              type="radio"
              name="package"
              id="both"
              value="both"
              checked={formData.package === 'both'}
              onChange={handlePackageChange}
            />
            <label htmlFor="both" className="ml-2">
              Both (${getPackagePrice('both')})
            </label>
          </div>

          <p className="mt-4 mb-2 text-sm font-medium text-gray-700">Add-ons</p>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              name="addons"
              value="petHair"
              checked={formData.addons.includes('petHair')}
              onChange={handleInputChange}
            />
            <span className="ml-2">Pet Hair Removal ($75)</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              name="addons"
              value="ceramic"
              checked={formData.addons.includes('ceramic')}
              onChange={handleInputChange}
            />
            <span className="ml-2">Ceramic Coating ($50)</span>
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              name="addons"
              value="paint"
              checked={formData.addons.includes('paint')}
              onChange={handleInputChange}
            />
            <span className="ml-2">Paint Correction ($100)</span>
          </label>

          <div className="mt-6 text-lg font-bold">
            Total: ${formData.calculatedPrice || 0}
          </div>
        </div>
      )}

      {/* Slide 3 */}
      {currentStep === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Does your car have pet hair?
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Removing pet hair can take longer...
          </p>
          <p className="mb-6 font-semibold">
            Do you have any pet hair inside your vehicle?
          </p>
          <div className="flex gap-4 justify-center">
            <button
              className={`
                px-4 py-3 text-white font-bold rounded 
                bg-blue-500
                shadow-[0_8px_0_0_#2563eb]
                hover:shadow-[0_8px_0_0_#1e40af]
                hover:translate-y-[2px] 
                active:shadow-none
                active:translate-y-[6px]
                transition-all duration-350
              `}
              onClick={() => setCurrentStep(2)}
            >
              YES
            </button>
            <button
              className={`
                px-4 py-3 text-white font-bold rounded 
                bg-blue-500
                shadow-[0_8px_0_0_#2563eb]
                hover:shadow-[0_8px_0_0_#1e40af]
                hover:translate-y-[2px]
                active:shadow-none
                active:translate-y-[6px]
                transition-all duration-350
              `}
              onClick={() => setCurrentStep(4)}
            >
              NO
            </button>
          </div>
        </div>
      )}

      {/* Slide 4 */}
      {currentStep === 4 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Schedule Your Service</h2>
          <div className="border p-4 rounded mb-4">
            {renderCalendar()}
            {renderSlots()}
          </div>

          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Cleaning Frequency
            </h3>
            <label className="block mb-1">
              <input
                type="radio"
                name="frequency"
                value="weekly"
                checked={formData.frequency === 'weekly'}
                onChange={handleInputChange}
              />
              <span className="ml-2">Weekly</span>
            </label>
            <label className="block mb-1">
              <input
                type="radio"
                name="frequency"
                value="biweekly"
                checked={formData.frequency === 'biweekly'}
                onChange={handleInputChange}
              />
              <span className="ml-2">Bi-Weekly</span>
            </label>
            <label className="block mb-1">
              <input
                type="radio"
                name="frequency"
                value="monthly"
                checked={formData.frequency === 'monthly'}
                onChange={handleInputChange}
              />
              <span className="ml-2">Monthly</span>
            </label>
            <label className="block mb-1">
              <input
                type="radio"
                name="frequency"
                value="bimonthly"
                checked={formData.frequency === 'bimonthly'}
                onChange={handleInputChange}
              />
              <span className="ml-2">Bi-Monthly</span>
            </label>
          </div>

          <p className="text-sm text-gray-600">
            $119 In & Out. Reminders Before Visit...
          </p>
        </div>
      )}

      {/* Slide 5 */}
      {currentStep === 5 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="First Name"
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Last Name"
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Water & Electricity Available?
          </label>
          <select
            name="utilities"
            value={formData.utilities}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          >
            <option value="">Select Yes/No</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Garage/Bathroom Available?
          </label>
          <select
            name="garage"
            value={formData.garage}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          >
            <option value="">Select Yes/No</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Additional Notes"
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />

          <div className="bg-gray-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
            <p>
              <strong>Vehicle:</strong> {formData.vehicleSize || 'N/A'} (
              {formData.condition || 'N/A'})
            </p>
            <p>
              <strong>Package:</strong> {formData.package || 'N/A'}
            </p>
            <p>
              <strong>Add-ons:</strong>{' '}
              {formData.addons.length
                ? formData.addons.join(', ')
                : 'No add-ons selected'}
            </p>
            <p>
              <strong>Appointment:</strong>{' '}
              {formData.date && formData.time
                ? `${formData.date} at ${formData.time}`
                : 'Not selected'}
            </p>
            <p>
              <strong>Frequency:</strong> {formData.frequency || 'N/A'}
            </p>
            <p className="mt-2">
              <strong>Total Before Tax:</strong> $
              {formData.calculatedPrice || 0}
            </p>

            {/* Display Tax Info */}
            <p>
              <strong>Tax Rate:</strong> {taxInfo.taxRate || 0}%
            </p>
            <p>
              <strong>Tax Amount:</strong> ${taxInfo.totalTax}
            </p>
            <p>
              <strong>Total After Tax:</strong> ${taxInfo.totalAfterTax}
            </p>
          </div>
        </div>
      )}

      {/* Slide 6 => Payment => We'll rename the Nav button to "Skip" */}
      {currentStep === 6 && (
        <PaymentSlide
          formData={formData}
          setFormData={setFormData}
          onPaymentComplete={async () => {
            // After confirming billing => post data
            await postFormDataToCloud();
            setCurrentStep(7);
          }}
        />
      )}

      {/* Slide 7 => done */}
      {currentStep === 7 && (
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-4">Booking Complete!</h2>
          <p className="mb-4 text-sm text-gray-600">
            Thanks for booking with us. You can pay on the day of service if you
            skipped now.
          </p>
          <button
            onClick={handleBookAnother}
            className="
              px-6 py-3 rounded font-bold text-white
              bg-pink-500
              shadow-[0_8px_0_0_#c026d3]
              hover:shadow-[0_8px_0_0_#a21caf]
              active:shadow-none
              active:translate-y-[6px]
              transition-all duration-350
            "
          >
            Book Another Detail
          </button>
        </div>
      )}

      {/* Nav Buttons => hide if step=7 */}
      {currentStep < 7 && (
        <div className="mt-6 flex justify-between">
          {/* Back */}
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`
              px-4 py-3 text-white font-bold rounded 
              bg-gray-500
              shadow-[0_8px_0_0_#4b5563]
              hover:shadow-[0_8px_0_0_#374151]
              hover:translate-y-[2px]
              active:shadow-none
              active:translate-y-[6px]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-350
            `}
          >
            Back
          </button>

          {/* Next or "Skip" if currentStep===6 */}
          <button
            onClick={handleNext}
            disabled={currentStep === 3} // disable if on step 3
            className={`
              px-4 py-3 text-white font-bold rounded 
              bg-blue-500
              shadow-[0_8px_0_0_#2563eb]
              hover:shadow-[0_8px_0_0_#1e40af]
              hover:translate-y-[2px]
              active:shadow-none
              active:translate-y-[6px]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-350
            `}
          >
            {currentStep === 6
              ? 'Skip'
              : currentStep < totalSteps
                ? 'Next'
                : 'Submit'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------- PaymentSlide (Step 6) ----------- */
function PaymentSlide({ formData, setFormData, onPaymentComplete }) {
  const stripe = useStripe();
  const elements = useElements();

  // Autofill fields if the user hasn't already typed them
  useEffect(() => {
    if (!formData.nameOnCard) {
      setFormData((prev) => ({
        ...prev,
        nameOnCard: (formData.firstName + ' ' + formData.lastName).trim(),
      }));
    }
    if (!formData.cardPhone && formData.phone) {
      setFormData((prev) => ({
        ...prev,
        cardPhone: formData.phone,
      }));
    }
    if (!formData.cardEmail && formData.email) {
      setFormData((prev) => ({
        ...prev,
        cardEmail: formData.email,
      }));
    }
  }, [formData, setFormData]);

  // Our replacement for handleConfirmBilling
  const handleAction = async (saveAndCharge = false) => {
    if (!stripe || !elements) {
      alert('Stripe has not loaded yet');
      return;
    }

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);

      // 1) Create the PaymentMethod with a hardcoded address
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: formData.nameOnCard || 'N/A',
          phone: formData.cardPhone || '',
          email: formData.cardEmail || '',
          address: {
            line1: '197 Pinecone Dr',
            city: 'Lawrence',
            state: 'KS',
            postal_code: '66046',
            country: 'US',
          },
        },
      });

      if (error) {
        console.error('Payment Error:', error);
        alert(error.message);
        return;
      }

      // 2) Send it to your backend, including save_and_charge if desired
      const response = await fetch(paymentEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: { id: paymentMethod.id }, // Send only the `id`
          save_and_charge: true,
          name: formData.nameOnCard,
          phone: formData.cardPhone,
          email: formData.cardEmail,
          address: {
            line1: '197 Pinecone Dr',
            city: 'Lawrence',
            state: 'KS',
            postal_code: '66046',
            country: 'US',
          },
          amount: 1000, // Replace with actual amount in cents
        }),
      });
      

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error.message || 'Please try again later.'}`);
        return;
      }

      // If your backend returns success or a client_secret, handle it:
      if (data.success) {
        alert('Customer created successfully!');
        // Or do whatever your flow requires
      } else if (data.client_secret && saveAndCharge) {
        // (Optional) Confirm payment immediately
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
          payment_method: paymentMethod.id,
        });

        if (confirmError) {
          alert(`Payment failed: ${confirmError.message}`);
        } else if (paymentIntent?.status === 'succeeded') {
          alert('Payment successful!');
          // Optionally clear fields here
        } else {
          alert('Payment processing. Check your email for updates.');
        }
      }

      // If everything is good, store the Customer ID or move on
      if (onPaymentComplete) {
        await onPaymentComplete();
      }
    } catch (err) {
      console.error('Error creating payment method or customer:', err);
      alert('An error occurred while processing your payment');
    }
  };

  // 3) Attach handleAction to a button
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Confirm Payment Info</h2>
      <p className="mb-4 text-sm text-gray-600">
        Your card will not be charged at this time.
      </p>

      {/* Simple form fields here */}
      <label className="block mb-2 text-sm font-medium text-gray-700">
        Name on Card
      </label>
      <input
        type="text"
        name="nameOnCard"
        value={formData.nameOnCard}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, nameOnCard: e.target.value }))
        }
        placeholder="Full name on card"
        className="w-full border border-gray-300 rounded-md p-2 mb-4"
      />

      {/* Render your Stripe elements here */}
      <label className="block mb-2 text-sm font-medium text-gray-700">
        Card Number
      </label>
      <div className="w-full border border-gray-300 rounded-md p-2 mb-4">
        <CardNumberElement />
      </div>

      <label className="block mb-2 text-sm font-medium text-gray-700">
        Expiration
      </label>
      <div className="w-full border border-gray-300 rounded-md p-2 mb-4">
        <CardExpiryElement />
      </div>

      <label className="block mb-2 text-sm font-medium text-gray-700">
        CVC
      </label>
      <div className="w-full border border-gray-300 rounded-md p-2 mb-4">
        <CardCvcElement />
      </div>

      <button
        type="button"
        onClick={() => handleAction(false)}
        className="bg-blue-700 text-white px-6 py-3 rounded font-bold"
      >
        CONFIRM BILLING
      </button>
    </div>
  );
}

/* --------------------- Root Export w/ <Elements> --------------------- */
export default function BookingWithStripe() {
  return (
    <Elements stripe={stripePromise}>
      <BookingForm />
    </Elements>
  );
}
