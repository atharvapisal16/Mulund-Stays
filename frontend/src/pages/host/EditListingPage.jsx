import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Trash2, Upload, Image as ImageIcon, Eye, X, ChevronUp, ChevronDown } from 'lucide-react';
import { listingAPI } from '@/services/api';
import { PageHeader, FieldError, Spinner, PageLoader } from '@/components/common/UI';
import { MULUND_AREAS, PROPERTY_TYPES, AMENITIES_CONFIG, listingStatusColor } from '@/utils/helpers';
import toast from 'react-hot-toast';

const EDIT_STEPS = ['Basics', 'Location', 'Amenities', 'Pricing', 'Rules & Availability', 'Photos'];

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [amenities, setAmenities] = useState({});
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const { data: listing, isLoading: listingLoading, error: listingError } = useQuery({
    queryKey: ['listing-edit', id],
    queryFn: () => listingAPI.getById(id),
    select: (d) => d?.data,
    retry: 2,
  });

  const { register, handleSubmit, getValues, formState: { errors }, reset } = useForm({
    defaultValues: {
      propertyType: 'entire_flat',
      'capacity.maxGuests': 2,
      'capacity.bedrooms': 1,
      'capacity.beds': 1,
      'capacity.bathrooms': 1,
      'pricing.basePrice': 1000,
      'pricing.cleaningFee': 0,
      'pricing.securityDeposit': 0,
      'availability.minStay': 1,
      'availability.maxStay': 30,
      'availability.checkInTime': '12:00',
      'availability.checkOutTime': '11:00',
      cancellationPolicy: 'moderate',
      'location.area': 'Mulund West',
      'location.city': 'Mumbai',
      'location.state': 'Maharashtra',
    },
  });

  // Populate form with existing listing data
  useEffect(() => {
    if (listing) {
      reset({
        title: listing.title,
        description: listing.description,
        propertyType: listing.propertyType,
        'capacity.maxGuests': listing.capacity?.maxGuests,
        'capacity.bedrooms': listing.capacity?.bedrooms,
        'capacity.beds': listing.capacity?.beds,
        'capacity.bathrooms': listing.capacity?.bathrooms,
        'location.flatNo': listing.location?.flatNo,
        'location.buildingName': listing.location?.buildingName,
        'location.street': listing.location?.street,
        'location.area': listing.location?.area,
        'location.pincode': listing.location?.pincode,
        'location.landmark': listing.location?.landmark,
        'building.floor': listing.building?.floor,
        'building.buildingType': listing.building?.buildingType,
        'building.hasLift': listing.building?.hasLift,
        'pricing.basePrice': listing.pricing?.basePrice,
        'pricing.weekendPrice': listing.pricing?.weekendPrice,
        'pricing.cleaningFee': listing.pricing?.cleaningFee,
        'pricing.securityDeposit': listing.pricing?.securityDeposit,
        'pricing.weeklyDiscount': listing.pricing?.weeklyDiscount,
        'pricing.monthlyDiscount': listing.pricing?.monthlyDiscount,
        'availability.checkInTime': listing.availability?.checkInTime || '12:00',
        'availability.checkOutTime': listing.availability?.checkOutTime || '11:00',
        'availability.minStay': listing.availability?.minStay,
        'availability.maxStay': listing.availability?.maxStay,
        'availability.instantBook': listing.availability?.instantBook,
        cancellationPolicy: listing.cancellationPolicy,
        'houseRules.noSmoking': listing.houseRules?.noSmoking,
        'houseRules.noParties': listing.houseRules?.noParties,
        'houseRules.noPets': listing.houseRules?.noPets,
        'amenities.wifiSpeed': listing.amenities?.wifiSpeed,
      });

      setAmenities(listing.amenities || {});
      setUploadedPhotos(listing.photos || []);
    }
  }, [listing, reset]);

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data) => listingAPI.update(id, data),
    onSuccess: () => {
      toast.success('Listing updated!');
      setStep(step + 1);
    },
    onError: (e) => toast.error(e.response?.data?.message || e.message),
  });

  const { mutate: submit, isPending: submitting } = useMutation({
    mutationFn: () => listingAPI.submitForApproval(id),
    onSuccess: () => {
      toast.success('✅ Submitted for Admin Verification! Check status in My Listings.');
      queryClient.invalidateQueries(['listing-edit', id]);
      navigate('/host/listings');
    },
    onError: (e) => toast.error(e.response?.data?.message || e.message),
  });

  const { mutate: deletePhoto } = useMutation({
    mutationFn: (photoId) => listingAPI.deletePhoto(id, photoId),
    onSuccess: () => {
      toast.success('Photo deleted');
      setUploadedPhotos(uploadedPhotos.filter(p => p._id !== photoId));
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    // Check photo limit constraint
    if (uploadedPhotos.length + files.length > 5) {
      toast.error(`Maximum 5 photos allowed. You can add ${5 - uploadedPhotos.length} more.`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('photos', f));
    try {
      const res = await listingAPI.uploadPhotos(id, formData);
      // Update state with all photos from response
      if (res.data?.photos) {
        setUploadedPhotos(res.data.photos);
      }
      toast.success(`${files.length} photo(s) uploaded!`);
      // Clear file input
      e.target.value = '';
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = handleSubmit((data) => {
    const payload = { ...data, amenities };

    const nested = {};
    Object.entries(payload).forEach(([k, v]) => {
      if (k.includes('.')) {
        const parts = k.split('.');
        if (!nested[parts[0]]) nested[parts[0]] = {};
        nested[parts[0]][parts[1]] = v;
      } else {
        nested[k] = v;
      }
    });

    if (step < EDIT_STEPS.length - 1) {
      update(nested);
    }
  });

  const toggleAmenity = (key) => setAmenities((a) => ({ ...a, [key]: !a[key] }));

  const isPending = updating;

  if (listingLoading) return <PageLoader />;
  if (!listing || listingError) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Edit Listing" subtitle="Unable to load listing" />
        <div className="card p-6 text-center">
          <p className="text-dark-400 mb-4">Sorry, we couldn't find this listing. It may have been deleted.</p>
          <Link to="/host/listings" className="btn-primary">Back to My Listings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Edit Listing"
        subtitle={listing.title}
        back={<Link to="/host/listings" className="text-sm text-brand-400">← My Listings</Link>}
        action={
          <div className="flex gap-2">
            <Link to={`/listings/${id}`} className="btn-secondary text-sm py-2"><Eye size={14} /> Preview</Link>
            {['draft', 'rejected'].includes(listing.status) && uploadedPhotos.length >= 3 && (
              <button onClick={() => submit()} disabled={submitting} className="btn-primary text-sm py-2">
                {submitting ? <Spinner size="sm" /> : <Upload size={14} />} {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            )}
          </div>
        }
      />

      {/* Status Badge */}
      <div className={`badge ${listingStatusColor(listing.status)} mb-6 capitalize`}>
        {listing.status?.replace(/_/g, ' ')}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-8">
        {EDIT_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-500 text-white' : 'bg-dark-700 text-dark-400'
            }`}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'text-dark-200' : 'text-dark-500'}`}>{s}</span>
            {i < EDIT_STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-500/40' : 'bg-dark-700'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="card p-6"
        >
          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-dark-50">Property Basics</h2>
              <div className="form-group">
                <label>Listing Title *</label>
                <input placeholder='e.g. "Cozy 1BHK near Mulund Station"'
                  {...register('title', { required: 'Title required', maxLength: { value: 100, message: 'Max 100 chars' } })} />
                <FieldError message={errors.title?.message} />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea rows={4} placeholder="Describe your property — highlights, nearby landmarks, vibe..."
                  className="resize-none" {...register('description', { required: 'Description required' })} />
                <FieldError message={errors.description?.message} />
              </div>
              <div className="form-group">
                <label>Property Type *</label>
                <select {...register('propertyType')}>
                  {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Max Guests', name: 'capacity.maxGuests', min: 1, max: 20 },
                  { label: 'Bedrooms', name: 'capacity.bedrooms', min: 0, max: 10 },
                  { label: 'Beds', name: 'capacity.beds', min: 1, max: 20 },
                  { label: 'Bathrooms', name: 'capacity.bathrooms', min: 1, max: 10 },
                ].map((f) => (
                  <div key={f.name} className="form-group">
                    <label>{f.label}</label>
                    <input type="number" min={f.min} max={f.max} {...register(f.name, { valueAsNumber: true })} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-dark-50">Location</h2>
              <p className="text-sm text-dark-400">Exact address is only shared with guests after booking confirmation.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Flat / Unit No.</label>
                  <input placeholder="304" {...register('location.flatNo')} />
                </div>
                <div className="form-group">
                  <label>Building Name</label>
                  <input placeholder="Sai Krupa Heights" {...register('location.buildingName')} />
                </div>
              </div>
              <div className="form-group">
                <label>Street / Road *</label>
                <input placeholder="LBS Marg" {...register('location.street', { required: 'Street required' })} />
                <FieldError message={errors['location.street']?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Area *</label>
                  <select {...register('location.area')}>
                    {MULUND_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>PIN Code *</label>
                  <input placeholder="400080" maxLength={6} {...register('location.pincode', {
                    required: 'PIN required', pattern: { value: /^\d{6}$/, message: 'Invalid PIN' },
                  })} />
                  <FieldError message={errors['location.pincode']?.message} />
                </div>
              </div>
              <div className="form-group">
                <label>Landmark</label>
                <input placeholder="Near Mulund Station" {...register('location.landmark')} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="form-group">
                  <label>Floor</label>
                  <input type="number" {...register('building.floor', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label>Building Type</label>
                  <select {...register('building.buildingType')}>
                    <option value="apartment">Apartment</option>
                    <option value="independent_house">Independent House</option>
                    <option value="society_flat">Society Flat</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>
                <div className="form-group flex flex-col">
                  <label>Lift Available</label>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input type="checkbox" {...register('building.hasLift')} className="w-4 h-4 rounded accent-brand-500" />
                    <span className="text-sm text-dark-300">Yes, lift available</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Amenities */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-dark-50">Amenities</h2>
              <p className="text-sm text-dark-400">Select all amenities available at your property.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES_CONFIG.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAmenity(a.key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all text-left ${
                      amenities[a.key]
                        ? 'bg-brand-500/15 border-brand-500 text-brand-300'
                        : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    <span className="text-base">{a.icon}</span>
                    <span className="text-xs leading-tight">{a.label}</span>
                    {amenities[a.key] && <Check size={12} className="ml-auto text-brand-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              {amenities.wifi && (
                <div className="form-group">
                  <label>WiFi Speed</label>
                  <input placeholder="e.g. 100 Mbps" {...register('amenities.wifiSpeed')} />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-dark-50">Pricing</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Base Price / night (₹) *</label>
                  <input type="number" min={100} {...register('pricing.basePrice', { required: true, valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label>Weekend Price / night (₹)</label>
                  <input type="number" min={0} placeholder="Leave blank if same" {...register('pricing.weekendPrice', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label>Cleaning Fee (₹)</label>
                  <input type="number" min={0} {...register('pricing.cleaningFee', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label>Security Deposit (₹)</label>
                  <input type="number" min={0} {...register('pricing.securityDeposit', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label>Weekly Discount (%)</label>
                  <input type="number" min={0} max={50} placeholder="e.g. 10" {...register('pricing.weeklyDiscount', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label>Monthly Discount (%)</label>
                  <input type="number" min={0} max={50} placeholder="e.g. 20" {...register('pricing.monthlyDiscount', { valueAsNumber: true })} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Rules & Availability */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-dark-50">Rules & Availability</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Check-in Time</label>
                  <input type="time" {...register('availability.checkInTime')} />
                </div>
                <div className="form-group">
                  <label>Check-out Time</label>
                  <input type="time" {...register('availability.checkOutTime')} />
                </div>
                <div className="form-group">
                  <label>Min Stay (nights)</label>
                  <input type="number" min={1} {...register('availability.minStay', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label>Max Stay (nights)</label>
                  <input type="number" min={1} max={365} {...register('availability.maxStay', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="form-group">
                <label>Cancellation Policy</label>
                <select {...register('cancellationPolicy')}>
                  <option value="flexible">Flexible — Full refund 24h before check-in</option>
                  <option value="moderate">Moderate — Full refund 5 days before</option>
                  <option value="strict">Strict — 50% refund 7 days before</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-dark-200 mb-2">House Rules</label>
                {[
                  { name: 'houseRules.noSmoking', label: '🚭 No smoking' },
                  { name: 'houseRules.noParties', label: '🎉 No parties or events' },
                  { name: 'houseRules.noPets', label: '🐾 No pets' },
                ].map((r) => (
                  <label key={r.name} className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg cursor-pointer">
                    <input type="checkbox" {...register(r.name)} className="w-4 h-4 accent-brand-500" />
                    <span className="text-sm text-dark-300">{r.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <input type="checkbox" {...register('availability.instantBook')} className="w-4 h-4 accent-brand-500" id="instantBook" />
                <label htmlFor="instantBook" className="cursor-pointer">
                  <p className="text-sm font-medium text-amber-300">⚡ Enable Instant Book</p>
                  <p className="text-xs text-dark-400">Guests can book without your approval. Higher visibility in search.</p>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Photos */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-dark-50">Photos</h2>
              <p className="text-sm text-dark-400">Minimum 3 and maximum 5 high-quality photos required for verification.</p>

              {/* Upload Area */}
              {uploadedPhotos.length < 5 && (
                <label className="block border-2 border-dashed border-dark-600 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500 transition-colors bg-dark-800/50">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center gap-3">
                    {uploading ? (
                      <>
                        <Spinner size="lg" />
                        <p className="text-sm text-dark-400">Uploading photos...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-brand-500/20 rounded-full flex items-center justify-center">
                          <Upload size={24} className="text-brand-400" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-100">Click to browse or drag & drop</p>
                          <p className="text-xs text-dark-400 mt-1">JPG, PNG or WebP up to 50MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              )}

              {/* Photo Count */}
              <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <span className="text-sm text-dark-300">Photos uploaded</span>
                <span className={`font-semibold ${uploadedPhotos.length >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {uploadedPhotos.length}/5
                </span>
              </div>

              {/* Photos Grid */}
              {uploadedPhotos.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {uploadedPhotos.map((p, i) => (
                      <div 
                        key={p._id || i} 
                        className="relative group aspect-square rounded-xl overflow-hidden bg-dark-700 cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setPreviewPhoto({ url: p.url, index: i, total: uploadedPhotos.length })}
                      >
                        <img src={p.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-dark-900/0 group-hover:bg-dark-900/40 transition-colors flex items-center justify-center">
                          <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePhoto(p._id);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Browse Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewPhoto({ url: uploadedPhotos[0].url, index: 0, total: uploadedPhotos.length })}
                    className="w-full py-2 px-4 bg-brand-500/10 border border-brand-500/30 text-brand-300 rounded-lg hover:bg-brand-500/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Eye size={16} /> Browse & Preview Photos
                  </button>
                </div>
              ) : (
                <div className="text-center p-6 bg-dark-700/50 rounded-lg">
                  <ImageIcon size={32} className="mx-auto text-dark-500 mb-2" />
                  <p className="text-sm text-dark-400">No photos yet</p>
                </div>
              )}

              {/* Validation Info */}
              <div className={`p-3 border rounded-lg flex gap-2 ${uploadedPhotos.length >= 3 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                <span className={uploadedPhotos.length >= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                  {uploadedPhotos.length >= 3 ? '✅' : '⚠️'}
                </span>
                <p className={`text-xs ${uploadedPhotos.length >= 3 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {uploadedPhotos.length < 3 
                    ? `Add at least ${3 - uploadedPhotos.length} more photo(s) to submit` 
                    : `You can add up to ${5 - uploadedPhotos.length} more photo(s)`}
                </p>
              </div>

              {/* Submit Button - Prominent when photos ready */}
              {uploadedPhotos.length >= 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-emerald-500/10 to-brand-500/10 border border-emerald-500/30 rounded-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (uploadedPhotos.length < 3) {
                        toast.error('Add at least 3 photos');
                        return;
                      }
                      if (uploadedPhotos.length > 5) {
                        toast.error('Maximum 5 photos allowed');
                        return;
                      }
                      submit();
                    }}
                    disabled={submitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    {submitting ? <Spinner size="sm" /> : <Check size={18} />}
                    Submit for Admin Approval
                  </button>
                  <p className="text-xs text-dark-400 mt-2 text-center">Your listing will be reviewed by our team</p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-2xl w-full bg-dark-800 rounded-xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-dark-900/80 hover:bg-dark-900 rounded-full flex items-center justify-center text-dark-300 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Image */}
            <div className="aspect-video bg-dark-900 flex items-center justify-center overflow-hidden">
              <img 
                src={previewPhoto.url} 
                alt="Preview" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Navigation & Info */}
            <div className="p-4 bg-dark-700 flex items-center justify-between">
              <button
                onClick={() => {
                  if (previewPhoto.index > 0) {
                    setPreviewPhoto({
                      ...previewPhoto,
                      index: previewPhoto.index - 1,
                      url: uploadedPhotos[previewPhoto.index - 1].url
                    });
                  }
                }}
                disabled={previewPhoto.index === 0}
                className="p-2 hover:bg-dark-600 disabled:opacity-30 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <span className="text-sm text-dark-300 font-medium">
                {previewPhoto.index + 1} of {previewPhoto.total}
              </span>
              
              <button
                onClick={() => {
                  if (previewPhoto.index < uploadedPhotos.length - 1) {
                    setPreviewPhoto({
                      ...previewPhoto,
                      index: previewPhoto.index + 1,
                      url: uploadedPhotos[previewPhoto.index + 1].url
                    });
                  }
                }}
                disabled={previewPhoto.index === uploadedPhotos.length - 1}
                className="p-2 hover:bg-dark-600 disabled:opacity-30 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 text-sm text-dark-500">
          Step {step + 1} of {EDIT_STEPS.length}
        </div>
        <button
          type="button"
          onClick={step === EDIT_STEPS.length - 1 ? () => {
            if (uploadedPhotos.length < 3) {
              toast.error('Add at least 3 photos');
              return;
            }
            if (uploadedPhotos.length > 5) {
              toast.error('Maximum 5 photos allowed');
              return;
            }
            submit();
          } : handleNext}
          disabled={isPending || submitting || (step === EDIT_STEPS.length - 1 && uploading)}
          className="btn-primary"
        >
          {isPending || submitting || uploading ? <Spinner size="sm" /> : null}
          {step === EDIT_STEPS.length - 1 ? 'Submit for Admin Approval' : 'Continue'}
          {step < EDIT_STEPS.length - 1 && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
