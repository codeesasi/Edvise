class SettingsManager {
    constructor() {
        // Default settings
        this.defaultSettings = {
            refreshInterval: 30000,
            itemsPerPage: 5
        };
        
        // Initialize with default settings
        this.settings = Object.assign({}, this.defaultSettings);
        
        // Load settings right away
        this.loadSettings();
    }
    
    // Save settings to localStorage and API
    async saveSettings() {
        // Save to localStorage first (as a fallback)
        localStorage.setItem('edvise_settings', JSON.stringify(this.settings));
        
        // Then save to API
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.settings)
            });
            console.log('Settings saved to API');
        } catch (error) {
            console.error('Failed to save settings to API:', error);
            // Still proceed with local changes since we saved to localStorage
        }
    }
    
    // Load settings from API first, then fallback to localStorage
    async loadSettings() {
        try {
            // Try to fetch from API first
            const response = await fetch('/api/settings');
            
            if (response.ok) {
                const apiSettings = await response.json();
                console.log('Settings loaded from API:', apiSettings);
                
                if (apiSettings && typeof apiSettings === 'object') {
                    // Process API settings, converting string values to appropriate types
                    this.settings = {
                        refreshInterval: parseInt(apiSettings.refreshInterval) || this.defaultSettings.refreshInterval,
                        itemsPerPage: parseInt(apiSettings.itemsPerPage) || this.defaultSettings.itemsPerPage
                    };
                    
                    // Also update localStorage with these settings
                    localStorage.setItem('edvise_settings', JSON.stringify(this.settings));
                    return this.settings;
                }
            }
            
            // If API fails, fall back to localStorage
            this.loadSettingsFromLocalStorage();
            
        } catch (e) {
            console.error('Error loading settings from API:', e);
            // Fallback to localStorage
            this.loadSettingsFromLocalStorage();
        }
        
        return this.settings;
    }
    
    // Helper method to load from localStorage
    loadSettingsFromLocalStorage() {
        try {
            const savedSettings = localStorage.getItem('edvise_settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.settings = {
                    refreshInterval: parsed.refreshInterval || this.defaultSettings.refreshInterval,
                    itemsPerPage: parsed.itemsPerPage || this.defaultSettings.itemsPerPage
                };
            }
        } catch (e) {
            console.error('Error loading settings from localStorage:', e);
            // If there's an error, use default settings
            this.settings = Object.assign({}, this.defaultSettings);
        }
    }
    
    // Get a specific setting
    getSetting(key) {
        return this.settings[key] || this.defaultSettings[key];
    }
    
    // Update a specific setting
    async updateSetting(key, value) {
        if (key in this.defaultSettings) {
            this.settings[key] = value;
            await this.saveSettings();
            return true;
        }
        return false;
    }
    
    // Update multiple settings at once
    async updateSettings(newSettings) {
        let changed = false;
        for (const [key, value] of Object.entries(newSettings)) {
            if (key in this.defaultSettings && this.settings[key] !== value) {
                this.settings[key] = value;
                changed = true;
            }
        }
        
        if (changed) {
            await this.saveSettings();
        }
        
        return changed;
    }
    
    showSettingsModal(onSaveCallback) {
        // Initialize settings modal if it exists
        const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
        if (!settingsModal) {
            return false;
        }
        
        // Fill the settings form with current values
        const itemsPerPageSelect = document.getElementById('itemsPerPage');
        const refreshIntervalInput = document.getElementById('refreshInterval');
        
        if (itemsPerPageSelect) {
            for (const option of itemsPerPageSelect.options) {
                if (parseInt(option.value) === this.settings.itemsPerPage) {
                    option.selected = true;
                    break;
                }
            }
        }
        
        if (refreshIntervalInput) {
            // Convert ms to seconds for the form
            refreshIntervalInput.value = this.settings.refreshInterval / 1000;
        }
        
        // Add event listener for save settings button
        const saveSettingsBtn = document.getElementById('saveSettings');
        if (saveSettingsBtn) {
            // Remove any existing event listeners to avoid duplicates
            const newSaveBtn = saveSettingsBtn.cloneNode(true);
            saveSettingsBtn.parentNode.replaceChild(newSaveBtn, saveSettingsBtn);
            
            newSaveBtn.addEventListener('click', () => {
                this.applySettings(onSaveCallback);
            });
        }
        
        settingsModal.show();
        return true;
    }
    
    async applySettings(callback) {
        try {
            // Get values from form
            const itemsPerPageSelect = document.getElementById('itemsPerPage');
            const refreshIntervalInput = document.getElementById('refreshInterval');
            
            const newSettings = {};
            
            // Update items per page if valid
            if (itemsPerPageSelect) {
                const newValue = parseInt(itemsPerPageSelect.value);
                if (!isNaN(newValue) && newValue > 0) {
                    newSettings.itemsPerPage = newValue;
                }
            }
            
            // Update refresh interval if valid (convert from seconds to ms)
            if (refreshIntervalInput) {
                const intervalSeconds = parseInt(refreshIntervalInput.value);
                if (!isNaN(intervalSeconds) && intervalSeconds >= 10) {
                    newSettings.refreshInterval = intervalSeconds * 1000;
                }
            }
            
            // Update the settings in backend API and localStorage
            const changed = await this.updateSettings(newSettings);
            
            // Hide the modal
            const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            if (settingsModal) {
                settingsModal.hide();
            }
            
            // Call the callback if settings were changed
            if (changed && typeof callback === 'function') {
                callback(this.settings);
            }
            
            return changed;
        } catch (error) {
            console.error('Error applying settings:', error);
            return false;
        }
    }
}

// Export the class
window.SettingsManager = SettingsManager;
