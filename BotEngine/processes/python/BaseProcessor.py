#!/usr/bin/env python3
"""
BaseProcessor - Python implementation
Base class for all Python-based node processors
"""

import sys
import json
import platform
import os


class BaseProcessor:
    """Base class for all Python processors"""
    
    def __init__(self):
        self.input_data = ""
        self.setup_stdin_handling()

    def setup_stdin_handling(self):
        """Setup stdin handling to read execution data"""
        try:
            # Read all input from stdin
            for line in sys.stdin:
                self.input_data += line

            # Parse and process the input
            properties = json.loads(self.input_data.strip())
            result = self.process(properties)
            self.send_result(result)
            
        except json.JSONDecodeError as error:
            self.send_error(f"Error parsing input JSON: {str(error)}")
        except Exception as error:
            self.send_error(f"Error during processing: {str(error)}")

    def process(self, execution_data):
        """
        Process method that must be implemented by child classes
        
        Args:
            execution_data (dict): Contains properties and runtimeInputs
            
        Returns:
            dict: Result with output, exitCode, status, and any additional data
        """
        raise NotImplementedError("process() method must be implemented by child class")

    def send_result(self, result):
        """Send result to stdout as JSON"""
        print(json.dumps(result))
        sys.stdout.flush()

    def send_error(self, error_message, exit_code=1):
        """Send error result to stdout"""
        error_result = {
            "output": error_message,
            "exitCode": exit_code,
            "status": False,
        }
        print(json.dumps(error_result))
        sys.stdout.flush()

    def detect_platform(self):
        """Detect the current platform"""
        system = platform.system().lower()
        if system == 'windows':
            return 'windows'
        elif system == 'darwin':
            return 'macos'
        elif system == 'linux':
            return 'linux'
        elif system in ['freebsd', 'openbsd', 'sunos', 'aix']:
            return 'unix'
        else:
            return 'unknown'

    def validate_required(self, properties, required_props):
        """
        Validate that required properties are present
        
        Args:
            properties (dict): Properties to validate
            required_props (list): List of required property names
            
        Raises:
            ValueError: If any required property is missing
        """
        for prop in required_props:
            if not properties.get(prop):
                raise ValueError(f"Required property '{prop}' is missing or empty")

    def get_property(self, properties, key, default_value=""):
        """
        Get a property value with a default fallback
        
        Args:
            properties (dict): Properties dictionary
            key (str): Property key
            default_value: Default value if key is not found
            
        Returns:
            Property value or default value
        """
        return properties.get(key, default_value)

    def substitute_variables(self, text, variables):
        """
        Substitute variables in text using {{variable}} syntax
        
        Args:
            text (str): Text containing variables
            variables (dict): Variable values
            
        Returns:
            str: Text with variables substituted
        """
        if not isinstance(text, str):
            return str(text)
            
        result = text
        for var_name, var_value in variables.items():
            if var_value is not None:
                placeholder = f"{{{{{var_name}}}}}"
                result = result.replace(placeholder, str(var_value))
        
        return result

    def safe_int(self, value, default=0):
        """Safely convert value to integer"""
        try:
            return int(value)
        except (ValueError, TypeError):
            return default

    def safe_float(self, value, default=0.0):
        """Safely convert value to float"""
        try:
            return float(value)
        except (ValueError, TypeError):
            return default

    def safe_bool(self, value, default=False):
        """Safely convert value to boolean"""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes', 'on')
        if isinstance(value, (int, float)):
            return value != 0
        return default

    def file_exists(self, path):
        """Check if file exists and is readable"""
        return os.path.isfile(path) and os.access(path, os.R_OK)

    def ensure_directory(self, path):
        """Ensure directory exists, create if it doesn't"""
        os.makedirs(path, exist_ok=True)

    def get_runtime_input(self, execution_data, key, fallback_key=None, default=None):
        """
        Get value from runtimeInputs with fallback to properties
        
        Args:
            execution_data (dict): Full execution data
            key (str): Primary key to look for
            fallback_key (str): Fallback key if primary not found
            default: Default value if neither key is found
            
        Returns:
            Value from runtimeInputs, properties, or default
        """
        runtime_inputs = execution_data.get('runtimeInputs', {})
        properties = execution_data.get('properties', {}).get('properties', {})
        
        # Check runtime inputs first
        if key in runtime_inputs:
            return runtime_inputs[key]
            
        # Check properties with original key
        if key in properties:
            return properties[key]
            
        # Check properties with fallback key
        if fallback_key and fallback_key in properties:
            return properties[fallback_key]
            
        return default
