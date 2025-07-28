<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
       @click.self="$emit('close')">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          Materiały dla {{ student?.name || 'Studenta' }}
        </h3>
        <button @click="$emit('close')"
                class="text-gray-400 hover:text-gray-500">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Upload section -->
      <div class="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <div v-if="!uploadInProgress">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Dodaj nowy materiał
          </label>
          <input type="file"
                 ref="fileInput"
                 @change="handleFileSelect"
                 accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                 class="hidden">
          <button @click="$refs.fileInput.click()"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            <svg class="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Wybierz plik
          </button>
          <p class="mt-2 text-sm text-gray-500">
            Dozwolone formaty: JPG, JPEG, PNG, PDF, DOC, DOCX (max 10MB)
          </p>
        </div>
        
        <!-- Upload progress -->
        <div v-else class="space-y-2">
          <p class="text-sm font-medium text-gray-700">
            Przesyłanie: {{ selectedFile?.name }}
          </p>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                 :style="`width: ${uploadProgress}%`"></div>
          </div>
          <p class="text-xs text-gray-500">{{ uploadProgress }}%</p>
        </div>
      </div>

      <!-- Materials list -->
      <div class="space-y-4 max-h-96 overflow-y-auto">
        <div v-if="loading" class="text-center py-4">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        
        <div v-else-if="materials.length === 0" class="text-center py-8 text-gray-500">
          Brak materiałów dla tego studenta
        </div>
        
        <div v-else v-for="material in materials" :key="material.id"
             class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ getFileIcon(material.mime_type) }}</span>
            <div>
              <p class="font-medium text-gray-900">{{ material.original_name }}</p>
              <p class="text-sm text-gray-500">
                {{ formatFileSize(material.file_size) }} • 
                Wersja {{ material.version }} • 
                {{ formatDate(material.uploaded_at) }}
              </p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <button @click="downloadMaterial(material)"
                    class="p-2 text-gray-400 hover:text-gray-500"
                    title="Pobierz">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </button>
            
            <button @click="toggleActive(material)"
                    class="p-2"
                    :class="material.is_active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'"
                    :title="material.is_active ? 'Aktywny' : 'Nieaktywny'">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <button @click="confirmDelete(material)"
                    class="p-2 text-red-400 hover:text-red-500"
                    title="Usuń">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Show versions toggle -->
      <div v-if="materials.length > 0" class="mt-4 text-center">
        <button @click="showAllVersions = !showAllVersions"
                class="text-sm text-blue-600 hover:text-blue-800">
          {{ showAllVersions ? 'Pokaż tylko aktualne' : 'Pokaż wszystkie wersje' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { MaterialsManager, type LessonMaterial } from '@/services/MaterialsManager';
import { showNotification } from '@/composables/useNotification';

const props = defineProps<{
  studentId: number;
  student?: any;
}>();

const emit = defineEmits<{
  close: [];
}>();

const materials = ref<LessonMaterial[]>([]);
const loading = ref(false);
const uploadInProgress = ref(false);
const uploadProgress = ref(0);
const selectedFile = ref<File | null>(null);
const showAllVersions = ref(false);
const fileInput = ref<HTMLInputElement>();

const displayMaterials = computed(() => {
  if (showAllVersions.value) {
    return materials.value;
  }
  
  // Show only latest versions
  const grouped = MaterialsManager.groupMaterialsByName(materials.value);
  const latest: LessonMaterial[] = [];
  
  grouped.forEach(versions => {
    const activeVersion = versions.find(v => v.is_active);
    latest.push(activeVersion || versions[0]);
  });
  
  return latest;
});

onMounted(() => {
  loadMaterials();
});

async function loadMaterials() {
  loading.value = true;
  try {
    if (showAllVersions.value) {
      materials.value = await MaterialsManager.getAllVersionsForStudent(props.studentId);
    } else {
      materials.value = await MaterialsManager.getMaterialsForStudent(props.studentId);
    }
  } catch (error) {
    console.error('Error loading materials:', error);
    showNotification('Błąd podczas ładowania materiałów', 'error');
  } finally {
    loading.value = false;
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  const validation = MaterialsManager.validateFile(file);
  if (!validation.valid) {
    showNotification(validation.error!, 'error');
    return;
  }
  
  selectedFile.value = file;
  uploadFile();
}

async function uploadFile() {
  if (!selectedFile.value) return;
  
  uploadInProgress.value = true;
  uploadProgress.value = 0;
  
  try {
    // Simulate progress (actual progress is handled in MaterialsManager)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 200);
    
    const material = await MaterialsManager.uploadMaterial({
      student_id: props.studentId,
      file: selectedFile.value
    });
    
    clearInterval(progressInterval);
    uploadProgress.value = 100;
    
    showNotification('Plik został przesłany pomyślnie', 'success');
    
    // Refresh materials list
    await loadMaterials();
    
    // Reset upload state
    setTimeout(() => {
      uploadInProgress.value = false;
      uploadProgress.value = 0;
      selectedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    }, 1000);
    
  } catch (error: any) {
    uploadInProgress.value = false;
    uploadProgress.value = 0;
    selectedFile.value = null;
    
    const errorMessage = error.message || 'Błąd podczas przesyłania pliku';
    showNotification(errorMessage, 'error');
  }
}

function downloadMaterial(material: LessonMaterial) {
  MaterialsManager.downloadMaterial(material.id);
}

async function toggleActive(material: LessonMaterial) {
  try {
    const newStatus = await MaterialsManager.toggleActive(material.id);
    material.is_active = newStatus;
    showNotification(
      newStatus ? 'Materiał został aktywowany' : 'Materiał został dezaktywowany',
      'success'
    );
  } catch (error) {
    showNotification('Błąd podczas zmiany statusu', 'error');
  }
}

function confirmDelete(material: LessonMaterial) {
  if (confirm(`Czy na pewno chcesz usunąć "${material.original_name}"?`)) {
    deleteMaterial(material);
  }
}

async function deleteMaterial(material: LessonMaterial) {
  try {
    await MaterialsManager.deleteMaterial(material.id);
    showNotification('Materiał został usunięty', 'success');
    await loadMaterials();
  } catch (error) {
    showNotification('Błąd podczas usuwania materiału', 'error');
  }
}

function getFileIcon(mimeType: string): string {
  return MaterialsManager.getFileIcon(mimeType);
}

function formatFileSize(bytes: number): string {
  return MaterialsManager.formatFileSize(bytes);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>