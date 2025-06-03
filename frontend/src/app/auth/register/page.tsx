'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Dumbbell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGymLocations, useMembershipPlans } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  phone: z.string().optional(),
  gymLocationId: z.string().min(1, 'Please select a gym location'),
  planId: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const { data: locationsData } = useGymLocations();
  const { data: plansData } = useMembershipPlans();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      await api.register(data);
      setIsSuccess(true);
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Registration Successful!</CardTitle>
            <CardDescription>
              We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/auth/login">Go to Login</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?{' '}
                <button className="text-primary hover:underline">
                  Resend verification
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary to-secondary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">FitZone Pro</h1>
              <p className="text-secondary-100">Join the Fitness Revolution</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold leading-tight">
                Start your fitness journey today
              </h2>
              <p className="text-xl text-secondary-100 mt-4">
                Join thousands of members who trust FitZone Pro for their fitness goals.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <span className="text-sm">🏋️</span>
                </div>
                <span>State-of-the-art equipment</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <span className="text-sm">👥</span>
                </div>
                <span>Expert personal trainers</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <span className="text-sm">📱</span>
                </div>
                <span>Mobile app integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FitZone Pro</h1>
                <p className="text-sm text-muted-foreground">Join the Fitness Revolution</p>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
              <CardDescription>
                Join FitZone Pro and start your fitness journey
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      {...register('firstName')}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      {...register('lastName')}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    {...register('phone')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a secure password"
                      {...register('password')}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymLocationId">Gym Location</Label>
                  <Select onValueChange={(value) => setValue('gymLocationId', value)}>
                    <SelectTrigger className={errors.gymLocationId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select your preferred gym location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsData?.locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gymLocationId && (
                    <p className="text-sm text-destructive">{errors.gymLocationId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planId">Membership Plan (optional)</Label>
                  <Select onValueChange={(value) => setValue('planId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a membership plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plansData?.plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price}/{plan.durationMonths} months
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    You can choose a plan later after registration
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>
            </CardContent>
            
            <CardContent className="pt-0">
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}