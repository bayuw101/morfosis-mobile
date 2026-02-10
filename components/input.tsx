import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, TextInputProps } from 'react-native';
import { cn } from '../lib/utils';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, secureTextEntry, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = secureTextEntry && !isPasswordVisible;

  return (
    <View className="space-y-1.5">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
        {label}
      </Text>
      <View 
        className={cn(
          "flex-row items-center border rounded-2xl bg-gray-50/50 h-14 px-4 overflow-hidden",
          isFocused ? "border-black bg-white" : "border-gray-200",
          error && "border-red-500 bg-red-50/10",
          className
        )}
      >
        {icon && (
          <View className="mr-3 text-gray-400">
            {icon}
          </View>
        )}
        <TextInput
          className="flex-1 text-[15px] font-medium text-gray-900 h-full"
          placeholderTextColor="#94a3b8"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword}
          {...props}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} className="p-2 -mr-2">
            {isPasswordVisible ? (
              <EyeOff size={20} color="#94a3b8" />
            ) : (
              <Eye size={20} color="#94a3b8" />
            )}
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-xs font-medium ml-1 flex-row items-center">
          {error}
        </Text>
      )}
    </View>
  );
}
