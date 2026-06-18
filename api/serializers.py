from rest_framework import serializers
from .models import AutoPart

class AutoPartSerializer(serializers.ModelSerializer):
    # Додаємо наше поле, яке саме рахує дефіцит
    is_deficit = serializers.ReadOnlyField() 

    class Meta:
        model = AutoPart
        fields = '__all__'