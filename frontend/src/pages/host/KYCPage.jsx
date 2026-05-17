import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { userAPI } from '@/services/api';
import { FieldError, Spinner } from '@/components/common/UI';
import toast from 'react-hot-toast';
import { TEST_DATA } from '@/utils/testData';

const isDev = import.meta.env.MODE === 'development';

export default function KYCPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      aadhaarNumber: '',
      panNumber: '',
    },
  });
  const [preview, setPreview] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
  });

  const { mutate: submitKYC, isPending } = useMutation({
    mutationFn: async (formData) => {
      const fd = new FormData();
      fd.append('aadhaarNumber', formData.aadhaarNumber);
      fd.append('panNumber', formData.panNumber);
      if (preview.aadhaarFront) fd.append('aadhaarFront', preview.aadhaarFront);
      if (preview.aadhaarBack) fd.append('aadhaarBack', preview.aadhaarBack);
      if (preview.panCard) fd.append('panCard', preview.panCard);
      return userAPI.submitKYC(fd);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'KYC submitted!');
      navigate('/host');
    },
    onError: (err) => toast.error(err.message || 'KYC submission failed'),
  });

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(prev => ({ ...prev, [field]: file }));
  };

  // Quick fill test data
  const fillTestData = () => {
    const testKYC = TEST_DATA.testUsers.host;
    document.getElementById('aadhaar').value = testKYC.aadhaar;
    document.getElementById('pan').value = testKYC.pan;
    toast.success('Test data filled! ✅');
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container-page max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-dark-50 mb-2">Complete Your KYC</h1>
            <p className="text-dark-400">We need to verify your identity to activate your hosting account.</p>
          </div>

          {/* Dev Mode Notice */}
          {isDev && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 flex gap-3">
              <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-300">
                <p className="font-semibold mb-1">📝 Development Mode</p>
                <p>File uploads are optional. You can submit without files for quick testing.</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8 flex gap-3">
            <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">Required Documents</p>
              <p>Valid Aadhaar + PAN with clear photos. Verification takes 24-48 hours.</p>
              {isDev && <p className="mt-1 text-xs italic">(Optional in dev mode)</p>}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(submitKYC)} className="space-y-6">
            {/* Aadhaar Number */}
            <div className="form-group">
              <label>Aadhaar Number (12 digits)</label>
              <input
                id="aadhaar"
                type="text"
                placeholder="123456789012"
                maxLength={12}
                {...register('aadhaarNumber', {
                  required: 'Aadhaar is required',
                  pattern: { value: /^\d{12}$/, message: '12 digits required' },
                })}
              />
              <FieldError message={errors.aadhaarNumber?.message} />
            </div>

            {/* Aadhaar Photos */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="form-group">
                <label>Aadhaar Front Photo {!isDev && <span className="text-red-400">*</span>}</label>
                <div className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 transition-colors"
                  onClick={() => document.getElementById('aadhaarFront').click()}>
                  {preview.aadhaarFront ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle size={24} className="text-green-400" />
                      <p className="text-sm text-dark-300">{preview.aadhaarFront.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-dark-400" />
                      <p className="text-sm text-dark-300">Upload front side</p>
                      {isDev && <p className="text-xs text-dark-500">(optional)</p>}
                    </div>
                  )}
                  <input
                    id="aadhaarFront"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleFileChange(e, 'aadhaarFront')}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Aadhaar Back Photo {!isDev && <span className="text-red-400">*</span>}</label>
                <div className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 transition-colors"
                  onClick={() => document.getElementById('aadhaarBack').click()}>
                  {preview.aadhaarBack ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle size={24} className="text-green-400" />
                      <p className="text-sm text-dark-300">{preview.aadhaarBack.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-dark-400" />
                      <p className="text-sm text-dark-300">Upload back side</p>
                      {isDev && <p className="text-xs text-dark-500">(optional)</p>}
                    </div>
                  )}
                  <input
                    id="aadhaarBack"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleFileChange(e, 'aadhaarBack')}
                  />
                </div>
              </div>
            </div>

            {/* PAN Number */}
            <div className="form-group">
              <label>PAN Number (10 characters)</label>
              <input
                id="pan"
                type="text"
                placeholder="ABCDE1234F"
                maxLength={10}
                {...register('panNumber', {
                  required: 'PAN is required',
                  pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Invalid PAN format' },
                })}
              />
              <FieldError message={errors.panNumber?.message} />
            </div>

            {/* PAN Card Photo */}
            <div className="form-group">
              <label>PAN Card Photo {!isDev && <span className="text-red-400">*</span>}</label>
              <div className="border-2 border-dashed border-dark-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 transition-colors"
                onClick={() => document.getElementById('panCard').click()}>
                {preview.panCard ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle size={24} className="text-green-400" />
                    <p className="text-sm text-dark-300">{preview.panCard.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={24} className="text-dark-400" />
                    <p className="text-sm text-dark-300">Upload PAN card photo</p>
                    {isDev && <p className="text-xs text-dark-500">(optional)</p>}
                  </div>
                )}
                <input
                  id="panCard"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFileChange(e, 'panCard')}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={fillTestData}
                className="btn-ghost flex-1"
              >
                📋 Fill Test Data
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Spinner size={20} />
                    Submitting...
                  </>
                ) : (
                  'Submit KYC'
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-dark-800/50 rounded-xl text-sm text-dark-400">
            <p className="font-semibold text-dark-300 mb-2">🔒 Your data is secure</p>
            <ul className="space-y-1 text-xs">
              <li>• Documents are encrypted and stored securely</li>
              <li>• Only admins can view your KYC documents</li>
              <li>• You can't list properties until KYC is approved</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
