<template>
    <ParentLayout>
        <template #page-bottom>
            <div style="text-align: center;">
                <a href="https://beian.miit.gov.cn">浙ICP备17055787号-1</a>
            </div>
        </template>
    </ParentLayout>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue'

export default {
    name: 'Layout',
    components: {
        ParentLayout
    }
}
</script>